/* eslint-disable @typescript-eslint/no-explicit-any */
import * as reportService from '../services/report.service.js';
import { assertClaimAccess } from '../services/claim.service.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { resolveFilePath } from '../utils/file-path.js';
import fs from 'fs';
import path from 'path';
import type { Request, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { parseWithAppError } from '../validators/index.js';
import { ListReportsQuerySchema } from '../validators/report.js';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export const listReports: RequestHandler = async (req, res, next) => {
  try {
    const query = parseWithAppError(ListReportsQuerySchema, req.query);
    const data = await reportService.listReports(Number(req.params.claimId), (req as AuthenticatedRequest).user, query);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any);
  }
}

export const createReport: RequestHandler = async (req, res, next) => {
  try {
    const item = await reportService.createReportDraft(Number(req.params.claimId), req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const generateReport: RequestHandler = async (req, res, next) => {
  try {
    const signal = (req as { signal?: AbortSignal }).signal;
    const item = await reportService.generateReport(Number(req.params.claimId), idParam(req), (req as AuthenticatedRequest).user, signal);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const createClarification: RequestHandler = async (req, res, next) => {
  try {
    const item = await reportService.createClarification(Number(req.params.claimId), idParam(req), req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const answerClarification: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(Number(req.params.clarificationId));
    if (Number.isNaN(id)) throw new AppError('Invalid clarification id', 400);
    const item = await reportService.answerClarification(Number(req.params.claimId), id, req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err) { next(err as any);
  }
}

export const downloadReport: RequestHandler = async (req, res, next) => {
  try {
    const id = idParam(req);
    const report = await prisma.report.findUnique({
      where: { id },
      include: { claim: { select: { engineerId: true, accountantId: true, createdById: true } } },
    });
    if (!report || !report.pdfPath) throw new AppError('Report not found', 404);
    if (report.claimId !== Number(Number(req.params.claimId))) throw new AppError('Report not found', 404);
    assertClaimAccess((req as AuthenticatedRequest).user, report.claim);

    const resolved = resolveFilePath(report.pdfPath);
    if (!resolved || !fs.existsSync(resolved)) throw new AppError('PDF not found', 404);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(resolved))}`);

    const signal = (req as { signal?: AbortSignal }).signal;
    if (signal) {
      signal.addEventListener('abort', () => { res.destroy(); }, { once: true });
    }

    res.sendFile(resolved);
  } catch (err) { next(err as any);
  }
}

export const downloadDocx: RequestHandler = async (req, res, next) => {
  try {
    const id = idParam(req);
    const report = await prisma.report.findUnique({
      where: { id },
      include: { claim: { select: { engineerId: true, accountantId: true, createdById: true } } },
    });
    if (!report || !report.docxPath) throw new AppError('DOCX not found', 404);
    if (report.claimId !== Number(Number(req.params.claimId))) throw new AppError('Report not found', 404);
    assertClaimAccess((req as AuthenticatedRequest).user, report.claim);

    const resolved = resolveFilePath(report.docxPath);
    if (!resolved || !fs.existsSync(resolved)) throw new AppError('File not found', 404);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(resolved))}`);

    const signal = (req as { signal?: AbortSignal }).signal;
    if (signal) {
      signal.addEventListener('abort', () => { res.destroy(); }, { once: true });
    }

    res.sendFile(resolved);
  } catch (err) { next(err as any);
  }
}
