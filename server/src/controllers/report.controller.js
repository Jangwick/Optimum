import * as reportService from '../services/report.service.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import fs from 'fs';
import path from 'path';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listReports(req, res, next) {
  try {
    const items = await reportService.listReports(req.params.claimId);
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const item = await reportService.createReportDraft(req.params.claimId, req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function generateReport(req, res, next) {
  try {
    const item = await reportService.generateReport(idParam(req), req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function createClarification(req, res, next) {
  try {
    const item = await reportService.createClarification(idParam(req), req.body, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function answerClarification(req, res, next) {
  try {
    const id = Number(req.params.clarificationId);
    if (Number.isNaN(id)) throw new AppError('Invalid clarification id', 400);
    const item = await reportService.answerClarification(id, req.body, req.user.id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req, res, next) {
  try {
    const id = idParam(req);
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report || !report.pdfPath) throw new AppError('Report not found', 404);
    if (!fs.existsSync(report.pdfPath)) throw new AppError('PDF not found', 404);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(report.pdfPath)}"`);
    res.sendFile(path.resolve(report.pdfPath));
  } catch (err) {
    next(err);
  }
}

export async function downloadDocx(req, res, next) {
  try {
    const id = idParam(req);
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report || !report.docxPath) throw new AppError('DOCX not found', 404);
    if (!fs.existsSync(report.docxPath)) throw new AppError('File not found', 404);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(report.docxPath)}"`);
    res.sendFile(path.resolve(report.docxPath));
  } catch (err) {
    next(err);
  }
}
