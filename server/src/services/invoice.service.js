import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';

async function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const count = await prisma.invoice.count({ where: { createdAt: { gte: new Date(year, 0, 1) } } });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function listInvoices(claimId) {
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

export async function createInvoice(claimId, data, userId) {
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
        notes: data.notes,
        createdById: userId,
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

  await logAction('INVOICE_CREATED', 'Invoice', invoice.id, userId, { claimId, totalAmount: invoice.totalAmount });
  return invoice;
}

export async function recordPayment(invoiceId, data, _userId) {
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });
  if (!invoice) throw new AppError('Invoice not found', 404);

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
      method: data.method,
      reference: data.reference,
      notes: data.notes,
    },
  });

  const newPaid = paid + amount;
  const status = newPaid >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status } });

  await logAction('PAYMENT_RECORDED', 'Payment', payment.id, _userId, { invoiceId: invoice.id, claimId: invoice.claimId, amount });
  return payment;
}

export async function getInvoice(id) {
  const item = await prisma.invoice.findUnique({
    where: { id },
    include: {
      fees: true,
      payments: true,
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (!item) throw new AppError('Invoice not found', 404);
  return item;
}
