import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/request-logger.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import masterDataRoutes from './routes/master-data.routes.js';
import claimRoutes from './routes/claim.routes.js';
import investigationRoutes from './routes/investigation.routes.js';
import contactRoutes from './routes/contact.routes.js';
import inspectionRoutes from './routes/inspection.routes.js';
import documentRoutes from './routes/document.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import settlementRoutes from './routes/settlement.routes.js';
import feeRoutes from './routes/fee.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import auditRoutes from './routes/audit.routes.js';
import taskRoutes from './routes/task.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import exportRoutes from './routes/export.routes.js';
import processStatusRoutes from './routes/process-status.routes.js';
import activityRoutes from './routes/activity.routes.js';
import discussionNoteRoutes from './routes/discussion-note.routes.js';
import searchRoutes from './routes/search.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// Trust proxy — Railway uses a reverse proxy
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS: allow the configured origin, localhost variants in dev, or any origin in production.
// Note: wildcard (*) cannot be used with credentials=true.
// Use the request origin dynamically when config.clientUrl is '*'.
const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (config.clientUrl === '*') return callback(null, true);
    if (config.clientUrl && origin === config.clientUrl) return callback(null, true);
    // Allow any localhost/127.0.0.1 origin in development
    if (config.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.nodeEnv === 'development' ? 1000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => req.path === '/api/health' || (req.path === '/api/auth/me' && req.method === 'GET'),
  })
);

// Legacy public static mount removed; files are served only through
// authenticated API endpoints (documents, reports) after access checks.

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/claims/:claimId/investigations', investigationRoutes);
app.use('/api/claims/:claimId/discussion-notes', discussionNoteRoutes);
app.use('/api/claims/:claimId/contacts', contactRoutes);
app.use('/api/claims/:claimId/inspections', inspectionRoutes);
app.use('/api/claims/:claimId/documents', documentRoutes);
app.use('/api/claims/:claimId/assessments', assessmentRoutes);
app.use('/api/claims/:claimId/settlements', settlementRoutes);
app.use('/api/claims/:claimId/fees', feeRoutes);
app.use('/api/claims/:claimId/invoices', invoiceRoutes);
app.use('/api/claims/:claimId/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/process-statuses', processStatusRoutes);
app.use('/api/claims', activityRoutes);
app.use('/api/search', searchRoutes);

const CLIENT_DIST_CANDIDATES: string[] = [
  process.env.CLIENT_DIST_PATH,
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
].filter((candidate): candidate is string => typeof candidate === 'string' && candidate.length > 0);

function resolveClientDist(): string | undefined {
  for (const candidate of CLIENT_DIST_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

// Serve built client (works in production and when client/dist exists)
const clientDist = resolveClientDist();
if (clientDist) {
  app.use(express.static(clientDist));
  // SPA fallback: serve index.html for non-API, non-file routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) return next();
    if (req.path.includes('.')) return next(); // let 404 handler return real files
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(`client/dist not found. Checked: ${CLIENT_DIST_CANDIDATES.join(', ')}`);
}

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

export default app;
