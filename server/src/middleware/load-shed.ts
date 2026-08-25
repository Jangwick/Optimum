import type { Request, Response, NextFunction } from 'express';
import { jobCounter, type JobType } from '../queue/job-counter.js';

const DEFAULT_THRESHOLD = 10;
const threshold = Number(process.env.LOAD_SHED_THRESHOLD) || DEFAULT_THRESHOLD;

function resolveJobType(path: string): JobType | null {
  if (path.startsWith('/api/export')) {
    return 'export';
  }
  if (path.startsWith('/api/reports') || path.includes('/reports/')) {
    return 'report';
  }
  if (path.startsWith('/api/imports') || path.includes('/import')) {
    return 'import';
  }
  return null;
}

export function loadShedMiddleware(req: Request, res: Response, next: NextFunction): void {
  const type = resolveJobType(req.path);
  if (!type) {
    next();
    return;
  }

  if (jobCounter.get(type) >= threshold) {
    res.set('Retry-After', '30');
    res.status(503).json({ success: false, error: 'Server busy, please retry later' });
    return;
  }

  jobCounter.increment(type);

  let finished = false;
  const onFinished = () => {
    if (finished) {
      return;
    }
    finished = true;
    res.removeListener('finish', onFinished);
    res.removeListener('close', onFinished);
    jobCounter.decrement(type);
  };

  res.on('finish', onFinished);
  res.on('close', onFinished);

  next();
}
