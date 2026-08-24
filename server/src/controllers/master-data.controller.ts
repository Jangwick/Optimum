/* eslint-disable @typescript-eslint/no-explicit-any */
import * as masterDataService from '../services/master-data.service.js';
import { AppError } from '../middleware/error.js';
import type { Request, RequestHandler } from 'express';

function idParam(req: Request) {
  const id = Number(Number(req.params.id));
  if (Number.isNaN(id)) throw new AppError('Invalid id', 400);
  return id;
}

// Insurance companies
export const listInsuranceCompanies: RequestHandler = async (req, res, next) => {
  try {
    const data = await masterDataService.listInsuranceCompanies((req.query as any));
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.getInsuranceCompany(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.createInsuranceCompany(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.updateInsuranceCompany(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    await masterDataService.deleteInsuranceCompany(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

// Clients
export const listClients: RequestHandler = async (req, res, next) => {
  try {
    const data = await masterDataService.listClients((req.query as any));
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getClient: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.getClient(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createClient: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.createClient(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateClient: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.updateClient(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteClient: RequestHandler = async (req, res, next) => {
  try {
    await masterDataService.deleteClient(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

// Policies
export const listPolicies: RequestHandler = async (req, res, next) => {
  try {
    const data = await masterDataService.listPolicies((req.query as any));
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getPolicy: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.getPolicy(idParam(req));
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createPolicy: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.createPolicy(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updatePolicy: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.updatePolicy(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deletePolicy: RequestHandler = async (req, res, next) => {
  try {
    await masterDataService.deletePolicy(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

// Lookups
export const listClaimTypes: RequestHandler = async (req, res, next) => {
  try {
    const items = await masterDataService.listClaimTypes();
    res.json({ success: true, items });
  } catch (err) { next(err as any); }
}

export const createClaimType: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.createClaimType(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateClaimType: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.updateClaimType(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteClaimType: RequestHandler = async (req, res, next) => {
  try {
    await masterDataService.deleteClaimType(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

export const listDocumentCategories: RequestHandler = async (req, res, next) => {
  try {
    const items = await masterDataService.listDocumentCategories();
    res.json({ success: true, items });
  } catch (err) { next(err as any); }
}

export const createDocumentCategory: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.createDocumentCategory(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateDocumentCategory: RequestHandler = async (req, res, next) => {
  try {
    const item = await masterDataService.updateDocumentCategory(idParam(req), req.body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteDocumentCategory: RequestHandler = async (req, res, next) => {
  try {
    await masterDataService.deleteDocumentCategory(idParam(req));
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

export const listClaimStatuses: RequestHandler = async (req, res, next) => {
  try {
    const items = await masterDataService.listClaimStatuses();
    res.json({ success: true, items });
  } catch (err) { next(err as any); }
}
