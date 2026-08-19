import * as templateService from '../services/report-template.service.js';
import { AppError } from '../middleware/error.js';

export async function listTemplates(req, res, next) {
  try {
    const items = await templateService.listTemplates();
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req, res, next) {
  try {
    if (!req.file) throw new AppError('No template file uploaded', 400);
    const item = await templateService.createTemplate(req.body, req.file, req.user.id);
    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
}
