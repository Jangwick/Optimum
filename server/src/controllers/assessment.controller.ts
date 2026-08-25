/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import * as assessmentService from '../services/assessment.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req: Request) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

export async function listAssessments(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await assessmentService.getAssessments(req.params.claimId as string, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err: any) {
    next(err);
  }
}

export async function getAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await assessmentService.getAssessment(idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function createAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await assessmentService.createAssessment(req.params.claimId as string, req.body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function updateAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await assessmentService.updateAssessment(idParam(req), req.body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function deleteAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    await assessmentService.deleteAssessment(idParam(req), (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err: any) {
    next(err);
  }
}
