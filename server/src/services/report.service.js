import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const reportOutputDir = './uploads/reports';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function listReports(claimId) {
  return prisma.report.findMany({
    where: { claimId: Number(claimId) },
    include: { generatedBy: { select: { firstName: true, lastName: true } }, versions: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function defaultTemplateId() {
  let template = await prisma.reportTemplate.findFirst({ where: { name: 'Default HTML' } });
  if (!template) {
    template = await prisma.reportTemplate.create({
      data: { name: 'Default HTML', type: 'HTML', description: 'HTML to PDF template', isDefault: true },
    });
  }
  return template.id;
}

export async function createReportDraft(claimId, data, _userId) {
  const templateId = data.reportTemplateId ? Number(data.reportTemplateId) : await defaultTemplateId();
  return prisma.report.create({
    data: {
      claimId: Number(claimId),
      reportTemplateId: templateId,
      title: data.title,
      status: 'DRAFT',
      notes: data.notes,
    },
    include: { generatedBy: { select: { firstName: true, lastName: true } }, versions: true },
  });
}

export async function generateReport(id, userId) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { claim: { include: { client: true, insuranceCompany: true, claimType: true, engineer: true, status: true } } },
  });
  if (!report) throw new AppError('Report not found', 404);

  const claim = report.claim;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a2456; }
    h1 { color: #102175; }
    .meta { margin: 20px 0; border-bottom: 1px solid #e2e2e5; padding-bottom: 20px; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e2e2e5; padding: 8px; text-align: left; }
    th { background: #1a2456; color: white; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="meta">
    <p><strong>Claim:</strong> ${claim.claimNumber}</p>
    <p><strong>Client:</strong> ${claim.client?.name}</p>
    <p><strong>Insurer:</strong> ${claim.insuranceCompany?.name}</p>
    <p><strong>Type:</strong> ${claim.claimType?.name}</p>
    <p><strong>Engineer:</strong> ${claim.engineer ? `${claim.engineer.firstName} ${claim.engineer.lastName}` : '—'}</p>
    <p><strong>Status:</strong> ${claim.status?.name}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <div class="section">
    <h2>Summary</h2>
    <p>${report.notes || 'No summary provided.'}</p>
  </div>
</body>
</html>`;

  ensureDir(path.join(reportOutputDir, String(claim.id)));
  const fileName = `report-${id}-${Date.now()}.pdf`;
  const filePath = path.join(reportOutputDir, String(claim.id), fileName);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: filePath, format: 'A4', printBackground: true });
  await browser.close();

  const versionCount = await prisma.reportVersion.count({ where: { reportId: id } });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reportVersion.create({
      data: {
        reportId: id,
        versionNumber: versionCount + 1,
        pdfPath: filePath,
        generatedById: userId,
        notes: 'Generated from HTML template',
      },
    });

    return tx.report.update({
      where: { id },
      data: { status: 'SUBMITTED', generatedAt: new Date(), generatedById: userId, pdfPath: filePath },
      include: { generatedBy: { select: { firstName: true, lastName: true } }, versions: true },
    });
  });

  return updated;
}

export async function createClarification(reportId, data, userId) {
  const report = await prisma.report.findUnique({ where: { id: Number(reportId) } });
  if (!report) throw new AppError('Report not found', 404);

  return prisma.clarification.create({
    data: {
      reportId: Number(reportId),
      question: data.question,
      askedById: userId,
      status: 'ASKED',
    },
    include: { askedBy: { select: { firstName: true, lastName: true } }, answeredBy: { select: { firstName: true, lastName: true } } },
  });
}

export async function answerClarification(id, data, userId) {
  const clarification = await prisma.clarification.findUnique({ where: { id } });
  if (!clarification) throw new AppError('Clarification not found', 404);

  return prisma.clarification.update({
    where: { id },
    data: {
      answer: data.answer,
      answeredById: userId,
      answeredAt: new Date(),
      status: 'ANSWERED',
    },
    include: { askedBy: { select: { firstName: true, lastName: true } }, answeredBy: { select: { firstName: true, lastName: true } } },
  });
}
