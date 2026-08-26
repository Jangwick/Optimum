import { z } from 'zod';
import {
  PaginationQuerySchema,
  optionalNullableString,
  optionalNullableId,
  optionalNullableNumber,
  optionalString,
  toNumber,
  toNumberOrUndefined,
} from './index.js';

const statusCodes = [
  'NEW', 'ASSIGNED', 'INVESTIGATION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED',
  'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED', 'ASSESSMENT', 'REPORT_DRAFT',
  'REPORT_SUBMITTED', 'CLIENT_REVIEW', 'CLARIFICATION_NEEDED', 'CLARIFICATION_PROVIDED',
  'SETTLEMENT', 'OFFER_SENT', 'FEE_INVOICED', 'PAYMENT_RECEIVED', 'CLOSED', 'CANCELLED',
] as const;

const ClaimRegistrySchema = z.object({
  claimNumber: optionalNullableString(),
  policyId: optionalNullableId(),
  clientId: optionalNullableId(),
  insuranceCompanyId: optionalNullableId(),
  claimTypeId: optionalNullableId(),
  assignmentNumber: optionalNullableString(),
  insurerClaimNumber: optionalNullableString(),
  brokerId: optionalNullableId(),
  brokerReference: optionalNullableString(),
  assignedByName: optionalNullableString(),
  description: optionalNullableString(),
  natureOfLoss: optionalNullableString(),
  locationOfLoss: optionalNullableString(),
  classification: optionalNullableString(),
  dateOfLoss: optionalNullableString(),
  dateInspected: optionalNullableString(),
  letterRequestDate: optionalNullableString(),
  denialLetterDate: optionalNullableString(),
  policyPeriodText: optionalNullableString(),
  policyCoverageText: optionalNullableString(),
  estimatedLoss: optionalNullableNumber(),
  reserve: optionalNullableNumber(),
  actualLoss: optionalNullableNumber(),
  claimedAmount: optionalNullableNumber(),
  claimedAmountRaw: optionalNullableString(),
  reserveRaw: optionalNullableString(),
  proposedSettlement: optionalNullableNumber(),
  proposedSettlementRaw: optionalNullableString(),
  agreedSettlement: optionalNullableNumber(),
  agreedSettlementRaw: optionalNullableString(),
  engineerId: optionalNullableId(),
  accountantId: optionalNullableId(),
  handlingAdjuster: optionalNullableString(),
  policyNumber: optionalNullableString(),
  policyType: optionalNullableString(),
});

export const CreateClaimSchema = ClaimRegistrySchema;

export const UpdateClaimSchema = ClaimRegistrySchema.omit({ claimNumber: true });

export const UpdateStatusSchema = z.object({
  statusCode: z.enum(statusCodes),
  notes: optionalString(),
});

export const ListClaimsQuerySchema = PaginationQuerySchema.extend({
  status: z.string().exactOptional(),
  processStatus: z.string().exactOptional(),
  claimType: z.string().exactOptional(),
  clientId: z.preprocess(toNumberOrUndefined, z.number().int().positive().exactOptional()),
  engineerId: z.preprocess(toNumberOrUndefined, z.number().int().positive().exactOptional()),
  accountantId: z.preprocess(toNumberOrUndefined, z.number().int().positive().exactOptional()),
  insurerId: z.preprocess(toNumberOrUndefined, z.number().int().positive().exactOptional()),
  view: z.enum(['active', 'closed', 'cancelled']).exactOptional(),
  sortField: z.string().exactOptional(),
  sortOrder: z.enum(['asc', 'desc']).exactOptional(),
});

export const ClaimInsurerSchema = z.object({
  insuranceCompanyId: z.preprocess(toNumber, z.number().int().positive()),
  isLead: z.boolean().exactOptional(),
  participationPercent: z.preprocess(toNumber, z.number().min(0).max(100).nullable().exactOptional()),
  insurerClaimNumber: optionalNullableString(),
  proposedSettlement: optionalNullableNumber(),
  proposedSettlementRaw: optionalNullableString(),
  agreedSettlement: optionalNullableNumber(),
  agreedSettlementRaw: optionalNullableString(),
  paidAmount: optionalNullableNumber(),
  offerStatus: optionalNullableString(),
  paymentStatus: optionalNullableString(),
  notes: optionalNullableString(),
});

export const UpdateClaimInsurerSchema = ClaimInsurerSchema.omit({ insuranceCompanyId: true });
