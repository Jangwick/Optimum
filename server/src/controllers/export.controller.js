import * as exportService from '../services/export.service.js';

export async function exportClaims(req, res, next) {
  try {
    const buffer = await exportService.exportClaimsToExcel(req.query, req.user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=claims-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.end(buffer);
  } catch (err) {
    next(err);
  }
}
