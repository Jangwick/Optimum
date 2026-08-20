import * as analyticsService from '../services/analytics.service.js';

export async function getAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAnalytics(req.user);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}
