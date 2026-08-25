/* eslint-disable @typescript-eslint/no-explicit-any */
import * as masterDataService from '../services/master-data.service.js';
import type { RequestHandler } from 'express';
import { IdParamSchema, parseWithAppError } from '../validators/index.js';
import {
  ListInsuranceCompaniesQuerySchema,
  ListClientsQuerySchema,
  ListPoliciesQuerySchema,
  CreateInsuranceCompanySchema,
  UpdateInsuranceCompanySchema,
  CreateClientSchema,
  UpdateClientSchema,
  CreatePolicySchema,
  UpdatePolicySchema,
  CreateClaimTypeSchema,
  UpdateClaimTypeSchema,
  CreateDocumentCategorySchema,
  UpdateDocumentCategorySchema,
} from '../validators/master-data.js';

// Insurance companies
export const listInsuranceCompanies: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListInsuranceCompaniesQuerySchema, req.query);
    const data = await masterDataService.listInsuranceCompanies(filters);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await masterDataService.getInsuranceCompany(id);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const body = parseWithAppError(CreateInsuranceCompanySchema, req.body);
    const item = await masterDataService.createInsuranceCompany(body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateInsuranceCompanySchema, req.body);
    const item = await masterDataService.updateInsuranceCompany(id, body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteInsuranceCompany: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await masterDataService.deleteInsuranceCompany(id);
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

// Clients
export const listClients: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListClientsQuerySchema, req.query);
    const data = await masterDataService.listClients(filters);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getClient: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await masterDataService.getClient(id);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createClient: RequestHandler = async (req, res, next) => {
  try {
    const body = parseWithAppError(CreateClientSchema, req.body);
    const item = await masterDataService.createClient(body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateClient: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateClientSchema, req.body);
    const item = await masterDataService.updateClient(id, body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteClient: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await masterDataService.deleteClient(id);
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

// Policies
export const listPolicies: RequestHandler = async (req, res, next) => {
  try {
    const filters = parseWithAppError(ListPoliciesQuerySchema, req.query);
    const data = await masterDataService.listPolicies(filters);
    res.json({ success: true, ...data });
  } catch (err) { next(err as any); }
}

export const getPolicy: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const item = await masterDataService.getPolicy(id);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const createPolicy: RequestHandler = async (req, res, next) => {
  try {
    const body = parseWithAppError(CreatePolicySchema, req.body);
    const item = await masterDataService.createPolicy(body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updatePolicy: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdatePolicySchema, req.body);
    const item = await masterDataService.updatePolicy(id, body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deletePolicy: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await masterDataService.deletePolicy(id);
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
    const body = parseWithAppError(CreateClaimTypeSchema, req.body);
    const item = await masterDataService.createClaimType(body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateClaimType: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateClaimTypeSchema, req.body);
    const item = await masterDataService.updateClaimType(id, body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteClaimType: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await masterDataService.deleteClaimType(id);
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
    const body = parseWithAppError(CreateDocumentCategorySchema, req.body);
    const item = await masterDataService.createDocumentCategory(body);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const updateDocumentCategory: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    const body = parseWithAppError(UpdateDocumentCategorySchema, req.body);
    const item = await masterDataService.updateDocumentCategory(id, body);
    res.json({ success: true, item });
  } catch (err) { next(err as any); }
}

export const deleteDocumentCategory: RequestHandler = async (req, res, next) => {
  try {
    const id = parseWithAppError(IdParamSchema, req.params.id);
    await masterDataService.deleteDocumentCategory(id);
    res.json({ success: true });
  } catch (err) { next(err as any); }
}

export const listClaimStatuses: RequestHandler = async (req, res, next) => {
  try {
    const items = await masterDataService.listClaimStatuses();
    res.json({ success: true, items });
  } catch (err) { next(err as any); }
}
