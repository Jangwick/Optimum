import { Router } from 'express';
import { prisma } from '../db/client.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [userCount, roleCount, claimStatusCount, processStatusCount] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.claimStatus.count(),
      prisma.processStatus.count(),
    ]);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV?.trim() || 'development',
      seeded: {
        users: userCount,
        roles: roleCount,
        claimStatuses: claimStatusCount,
        processStatuses: processStatusCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
