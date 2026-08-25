import { z } from 'zod';
import {
  PaginationQuerySchema,
  optionalId,
  requiredId,
  optionalNumber,
  optionalNullableString,
  optionalString,
} from './index.js';

export const ListInsuranceCompaniesQuerySchema = PaginationQuerySchema;
export const ListClientsQuerySchema = PaginationQuerySchema;

export const ListPoliciesQuerySchema = PaginationQuerySchema.extend({
  clientId: optionalId(),
  insuranceCompanyId: optionalId(),
});

export const ListClaimTypesQuerySchema = PaginationQuerySchema.merge(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).default(100),
  })
);

export const ListDocumentCategoriesQuerySchema = PaginationQuerySchema.merge(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).default(100),
  })
);

export const ListClaimStatusesQuerySchema = PaginationQuerySchema.merge(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).default(100),
  })
);

export const CreateInsuranceCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: optionalString(),
  contactPerson: optionalNullableString(),
  email: optionalNullableString(),
  phone: optionalNullableString(),
  address: optionalNullableString(),
});

export const UpdateInsuranceCompanySchema = CreateInsuranceCompanySchema.partial();

export const CreateClientSchema = CreateInsuranceCompanySchema;
export const UpdateClientSchema = CreateClientSchema.partial();

export const CreatePolicySchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  clientId: requiredId(),
  insuranceCompanyId: requiredId(),
  claimTypeId: requiredId(),
  coverageDetails: optionalNullableString(),
  policyType: optionalNullableString(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: optionalNullableString(),
  sumInsured: optionalNumber(),
  premium: optionalNumber(),
  excess: optionalNumber(),
  notes: optionalNullableString(),
});

export const UpdatePolicySchema = CreatePolicySchema.partial();

export const CreateClaimTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: optionalNullableString(),
});

export const UpdateClaimTypeSchema = CreateClaimTypeSchema.partial();

export const CreateDocumentCategorySchema = CreateClaimTypeSchema;
export const UpdateDocumentCategorySchema = CreateDocumentCategorySchema.partial();
