import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  listInsuranceCompanies,
  getInsuranceCompany,
  createInsuranceCompany,
  updateInsuranceCompany,
  deleteInsuranceCompany,
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listClaimTypes,
  listDocumentCategories,
  listClaimStatuses,
} from '../controllers/master-data.controller.js';

const router = Router();

router.use(authMiddleware);

// Insurance companies
router.get('/insurance-companies', listInsuranceCompanies);
router.get('/insurance-companies/:id', getInsuranceCompany);
router.post('/insurance-companies', requireRole('ADMIN'), createInsuranceCompany);
router.put('/insurance-companies/:id', requireRole('ADMIN'), updateInsuranceCompany);
router.delete('/insurance-companies/:id', requireRole('ADMIN'), deleteInsuranceCompany);

// Clients
router.get('/clients', listClients);
router.get('/clients/:id', getClient);
router.post('/clients', requireRole('ADMIN'), createClient);
router.put('/clients/:id', requireRole('ADMIN'), updateClient);
router.delete('/clients/:id', requireRole('ADMIN'), deleteClient);

// Policies
router.get('/policies', listPolicies);
router.get('/policies/:id', getPolicy);
router.post('/policies', requireRole('ADMIN'), createPolicy);
router.put('/policies/:id', requireRole('ADMIN'), updatePolicy);
router.delete('/policies/:id', requireRole('ADMIN'), deletePolicy);

// Lookups
router.get('/claim-types', listClaimTypes);
router.get('/document-categories', listDocumentCategories);
router.get('/claim-statuses', listClaimStatuses);

export default router;
