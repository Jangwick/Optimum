import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

interface InvoiceInput {
  feeIds?: (number | string)[];
  dueDate?: string | Date | null;
  notes?: string;
}

interface PaymentInput {
  amount: number | string;
  paymentDate?: string | Date;
  method?: string;
  reference?: string;
  notes?: string;
}

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const count = await prisma.invoice.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function listInvoices(claimId: number | string, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.invoice.findMany({
    where: { claimId: Number(claimId) },
    include: {
      fees: true,
      payments: true,
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createInvoice(claimId: number | string, data: InvoiceInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const feeIds = (data.feeIds || []).map(Number);
  const fees = await prisma.fee.findMany({
    where: { id: { in: feeIds }, claimId: Number(claimId), isInvoiced: false },
  });

  if (fees.length !== feeIds.length) {
    throw new AppError('Some fees are missing or already invoiced', 400);
  }

  const totalAmount = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const invoiceNumber = await generateInvoiceNumber();

  const created = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        claimId: Number(claimId),
        invoiceNumber,
        issueDate: new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        totalAmount,
        status: 'ISSUED',
        notes: data.notes ?? null,
        createdById: user.id,
      },
    });

    await tx.fee.updateMany({
      where: { id: { in: feeIds } },
      data: { isInvoiced: true, invoiceId: inv.id },
    });

    return inv;
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: created.id },
    include: { fees: true, payments: true, createdBy: { select: { firstName: true, lastName: true } } },
  });

  if (!invoice) throw new AppError('Invoice not found after creation', 500);

  await logAction('INVOICE_CREATED', 'Invoice', invoice.id, user.id, { claimId: Number(claimId), totalAmount: Number(invoice.totalAmount) });
  await recordActivity(Number(claimId), 'INVOICE_CREATED', `Invoice created: ${invoice.invoiceNumber} — ${Number(invoice.totalAmount || 0).toFixed(2)}`, user.id);
  await autoAdvanceStatus(Number(claimId), 'FEE_INVOICED', user.id);
  return invoice;
}

export async function recordPayment(invoiceId: number | string, data: PaymentInput, user: AuthUser) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(invoiceId) },
    include: { claim: true },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  assertClaimAccess(user, invoice.claim);

  const amount = Number(data.amount);
  const existingPayments = await prisma.payment.aggregate({
    where: { invoiceId: invoice.id },
    _sum: { amount: true },
  });
  const paid = Number(existingPayments._sum.amount || 0);

  if (paid + amount > Number(invoice.totalAmount)) {
    throw new AppError('Payment exceeds invoice total', 400);
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      method: data.method ?? null,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
    },
  });

  const newPaid = paid + amount;
  const status = newPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status } });

  await logAction('PAYMENT_RECORDED', 'Payment', payment.id, user.id, { invoiceId: invoice.id, claimId: invoice.claimId, amount });
  await recordActivity(invoice.claimId, 'PAYMENT_RECORDED', `Payment recorded: ${Number(amount || 0).toFixed(2)} for ${invoice.invoiceNumber}`, user.id);
  await autoAdvanceStatus(invoice.claimId, 'PAYMENT_RECEIVED', user.id);
  return payment;
}

export async function getInvoice(id: number, user: AuthUser) {
  const item = await prisma.invoice.findUnique({
    where: { id },
    include: {
      fees: true,
      payments: true,
      createdBy: { select: { firstName: true, lastName: true } },
      claim: true,
    },
  });
  if (!item) throw new AppError('Invoice not found', 404);
  assertClaimAccess(user, item.claim);
  return item;
}
