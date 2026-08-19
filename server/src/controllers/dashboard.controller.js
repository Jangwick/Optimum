import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboard(req.user);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
