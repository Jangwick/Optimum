import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { errorHandler } from './middleware/error.js';
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
import auditRoutes from './routes/audit.routes.js';
import exportRoutes from './routes/export.routes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health',
  })
);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/claims/:claimId/investigations', investigationRoutes);
app.use('/api/claims/:claimId/contacts', contactRoutes);
app.use('/api/claims/:claimId/inspections', inspectionRoutes);
app.use('/api/claims/:claimId/documents', documentRoutes);
app.use('/api/claims/:claimId/assessments', assessmentRoutes);
app.use('/api/claims/:claimId/settlements', settlementRoutes);
app.use('/api/claims/:claimId/fees', feeRoutes);
app.use('/api/claims/:claimId/invoices', invoiceRoutes);
app.use('/api/claims/:claimId/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/export', exportRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

export default app;
