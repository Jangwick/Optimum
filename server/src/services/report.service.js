import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { autoAdvanceStatus, assertClaimAccess } from './claim.service.js';
import { resolveFilePath } from '../utils/file-path.js';
import { config } from '../config/index.js';
import { formatCurrency } from '../utils/currency.js';
import { escapeHtml } from '../utils/escape-html.js';
import puppeteer from 'puppeteer';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const reportOutputDir = path.resolve(config.uploadDir, 'reports');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function listReports(claimId, user) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  return prisma.report.findMany({
    where: { claimId: Number(claimId) },
    include: {
      generatedBy: { select: { firstName: true, lastName: true } },
      versions: { orderBy: { versionNumber: 'desc' } },
      clarifications: {
        include: {
          askedBy: { select: { firstName: true, lastName: true } },
          answeredBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
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

export async function createReportDraft(claimId, data, user) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const templateId = await defaultTemplateId();
  const report = await prisma.report.create({
    data: {
      claimId: Number(claimId),
      reportTemplateId: templateId,
      title: data.title,
      status: 'DRAFT',
      notes: data.notes,
    },
    include: { generatedBy: { select: { firstName: true, lastName: true } }, versions: true },
  });
  await recordActivity(claimId, 'REPORT_CREATED', `Report draft created: ${data.title}`, user.id);
  await autoAdvanceStatus(claimId, 'REPORT_DRAFT', user.id);
  return report;
}

export async function generateReport(claimId, id, user) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: { reportTemplate: true, claim: { include: { client: true, insuranceCompany: true, claimType: true, engineer: true, status: true } } },
  });
  if (!report) throw new AppError('Report not found', 404);
  if (report.claimId !== Number(claimId)) throw new AppError('Report not found', 404);
  assertClaimAccess(user, report.claim);

  const claim = report.claim;

  const docData = {
    title: report.title,
    notes: report.notes || 'No summary provided.',
    generatedAt: new Date().toLocaleString(),
    claimNumber: claim.claimNumber,
    clientName: claim.client?.name || '',
    insurerName: claim.insuranceCompany?.name || '',
    claimType: claim.claimType?.name || '',
    engineerName: claim.engineer ? `${claim.engineer.firstName} ${claim.engineer.lastName}` : '—',
    statusName: claim.status?.name || '',
    dateOfLoss: claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : '—',
    estimatedLoss: formatCurrency(claim.estimatedLoss),
    reserve: formatCurrency(claim.reserve),
  };
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
  <h1>${escapeHtml(report.title)}</h1>
  <div class="meta">
    <p><strong>Claim:</strong> ${escapeHtml(claim.claimNumber)}</p>
    <p><strong>Client:</strong> ${escapeHtml(claim.client?.name)}</p>
    <p><strong>Insurer:</strong> ${escapeHtml(claim.insuranceCompany?.name)}</p>
    <p><strong>Type:</strong> ${escapeHtml(claim.claimType?.name)}</p>
    <p><strong>Engineer:</strong> ${claim.engineer ? escapeHtml(`${claim.engineer.firstName} ${claim.engineer.lastName}`) : '—'}</p>
    <p><strong>Status:</strong> ${escapeHtml(claim.status?.name)}</p>
    <p><strong>Estimated Loss:</strong> ${escapeHtml(formatCurrency(claim.estimatedLoss))}</p>
    <p><strong>Reserve:</strong> ${escapeHtml(formatCurrency(claim.reserve))}</p>
    <p><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}</p>
  </div>
  <div class="section">
    <h2>Summary</h2>
    <p>${escapeHtml(report.notes || 'No summary provided.')}</p>
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

  let docxPath = null;
  if (report.reportTemplate?.path) {
    const templatePath = resolveFilePath(report.reportTemplate.path, config.uploadDir);
    if (templatePath && fs.existsSync(templatePath)) {
    try {
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.setData(docData);
      doc.render();
      const buffer = doc.getZip().generate({ type: 'nodebuffer' });
      const docxFileName = `report-${id}-${Date.now()}.docx`;
      docxPath = path.join(reportOutputDir, String(claim.id), docxFileName);
      fs.writeFileSync(docxPath, buffer);
    } catch (err) {
      // If DOCX generation fails, still continue with PDF
      console.error('DOCX generation failed', err);
    }
    }
  }

  const versionCount = await prisma.reportVersion.count({ where: { reportId: id } });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reportVersion.create({
      data: {
        reportId: id,
        versionNumber: versionCount + 1,
        pdfPath: filePath,
        docxPath,
        generatedById: user.id,
        notes: 'Generated from template',
      },
    });

    return tx.report.update({
      where: { id },
      data: { status: 'SUBMITTED', generatedAt: new Date(), generatedById: user.id, pdfPath: filePath, docxPath },
      include: { generatedBy: { select: { firstName: true, lastName: true } }, versions: true },
    });
  });

  await logAction('REPORT_GENERATED', 'Report', id, user.id, { claimId: updated.claimId, pdfPath: filePath });
  await recordActivity(updated.claimId, 'REPORT_GENERATED', `Report generated: ${report.title}`, user.id);
  await autoAdvanceStatus(updated.claimId, 'REPORT_SUBMITTED', user.id);
  return updated;
}

export async function createClarification(claimId, reportId, data, user) {
  const report = await prisma.report.findUnique({
    where: { id: Number(reportId) },
    include: { claim: true },
  });
  if (!report) throw new AppError('Report not found', 404);
  if (report.claimId !== Number(claimId)) throw new AppError('Report not found', 404);
  assertClaimAccess(user, report.claim);

  const cl = await prisma.clarification.create({
    data: {
      reportId: Number(reportId),
      question: data.question,
      askedById: user.id,
      status: 'ASKED',
    },
    include: { askedBy: { select: { firstName: true, lastName: true } }, answeredBy: { select: { firstName: true, lastName: true } } },
  });
  await logAction('CLARIFICATION_CREATED', 'Clarification', cl.id, user.id, { reportId });
  await recordActivity(report.claimId, 'CLARIFICATION_REQUESTED', `Clarification requested: ${data.question?.slice(0, 80)}`, user.id);
  return cl;
}

export async function answerClarification(claimId, id, data, user) {
  const clarification = await prisma.clarification.findUnique({
    where: { id },
    include: { report: { include: { claim: true } } },
  });
  if (!clarification) throw new AppError('Clarification not found', 404);
  if (clarification.report.claimId !== Number(claimId)) throw new AppError('Clarification not found', 404);
  assertClaimAccess(user, clarification.report.claim);

  const cl = await prisma.clarification.update({
    where: { id },
    data: {
      answer: data.answer,
      answeredById: user.id,
      answeredAt: new Date(),
      status: 'ANSWERED',
    },
    include: { askedBy: { select: { firstName: true, lastName: true } }, answeredBy: { select: { firstName: true, lastName: true } } },
  });
  await logAction('CLARIFICATION_ANSWERED', 'Clarification', id, user.id, { reportId: cl.reportId });
  await recordActivity(clarification.report.claimId, 'CLARIFICATION_ANSWERED', `Clarification answered`, user.id);
  return cl;
}
