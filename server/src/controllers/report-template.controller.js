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

export async function deleteTemplate(req, res, next) {
  try {
    const id = Number(req.params.id);
    await templateService.deleteTemplate(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultTemplate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await templateService.setDefaultTemplate(id);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function downloadTemplate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const filePath = await templateService.getTemplatePath(id);
    res.download(filePath);
  } catch (err) {
    next(err);
  }
}
