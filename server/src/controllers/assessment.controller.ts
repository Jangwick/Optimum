/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import * as assessmentService from '../services/assessment.service.js';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import { CreateAssessmentSchema, UpdateAssessmentSchema } from '../validators/assessment.js';

export async function listAssessments(req: Request, res: Response, next: NextFunction) {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const items = await assessmentService.getAssessments(claimId, (req as AuthenticatedRequest).user);
    res.json({ success: true, items });
  } catch (err: any) {
    next(err);
  }
}

export async function getAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await assessmentService.getAssessment(id, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function createAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const claimId = parseWithAppError(IdParamSchema, req.params.claimId);
    const body = parseWithAppError(CreateAssessmentSchema, req.body);
    const item = await assessmentService.createAssessment(claimId, body, (req as AuthenticatedRequest).user);
    res.status(201).json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function updateAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateAssessmentSchema, req.body);
    const item = await assessmentService.updateAssessment(id, body, (req as AuthenticatedRequest).user);
    res.json({ success: true, item });
  } catch (err: any) {
    next(err);
  }
}

export async function deleteAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await assessmentService.deleteAssessment(id, (req as AuthenticatedRequest).user);
    res.json({ success: true });
  } catch (err: any) {
    next(err);
  }
}
