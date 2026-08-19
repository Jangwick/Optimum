import * as auditService from '../services/audit.service.js';

export async function listAuditLogs(req, res, next) {
  try {
    const data = await auditService.listAuditLogs(req.query);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
