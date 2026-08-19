import * as masterDataService from '../services/master-data.service.js';
import { AppError } from '../middleware/error.js';

function idParam(req) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

// Insurance companies
export async function listInsuranceCompanies(req, res, next) {
  try {
    const data = await masterDataService.listInsuranceCompanies(req.query);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

export async function getInsuranceCompany(req, res, next) {
  try {
    const item = await masterDataService.getInsuranceCompany(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function createInsuranceCompany(req, res, next) {
  try {
    const item = await masterDataService.createInsuranceCompany(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
}

export async function updateInsuranceCompany(req, res, next) {
  try {
    const item = await masterDataService.updateInsuranceCompany(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function deleteInsuranceCompany(req, res, next) {
  try {
    await masterDataService.deleteInsuranceCompany(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err); }
}

// Clients
export async function listClients(req, res, next) {
  try {
    const data = await masterDataService.listClients(req.query);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

export async function getClient(req, res, next) {
  try {
    const item = await masterDataService.getClient(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function createClient(req, res, next) {
  try {
    const item = await masterDataService.createClient(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
}

export async function updateClient(req, res, next) {
  try {
    const item = await masterDataService.updateClient(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function deleteClient(req, res, next) {
  try {
    await masterDataService.deleteClient(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err); }
}

// Policies
export async function listPolicies(req, res, next) {
  try {
    const data = await masterDataService.listPolicies(req.query);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

export async function getPolicy(req, res, next) {
  try {
    const item = await masterDataService.getPolicy(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function createPolicy(req, res, next) {
  try {
    const item = await masterDataService.createPolicy(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
}

export async function updatePolicy(req, res, next) {
  try {
    const item = await masterDataService.updatePolicy(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err); }
}

export async function deletePolicy(req, res, next) {
  try {
    await masterDataService.deletePolicy(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err); }
}

// Lookups
export async function listClaimTypes(req, res, next) {
  try {
    const items = await masterDataService.listClaimTypes();
    res.json({ success: true, items });
  } catch (err) { next(err); }
}

export async function listDocumentCategories(req, res, next) {
  try {
    const items = await masterDataService.listDocumentCategories();
    res.json({ success: true, items });
  } catch (err) { next(err); }
}

export async function listClaimStatuses(req, res, next) {
  try {
    const items = await masterDataService.listClaimStatuses();
    res.json({ success: true, items });
  } catch (err) { next(err); }
}
