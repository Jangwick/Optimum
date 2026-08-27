import { z } from 'zod';
import {
  PaginationQuerySchema,
  optionalNullableString,
  optionalNullableId,
  optionalNullableNumber,
  optionalString,
  toNumber,
  optionalId,
} from './index.js';

const statusCodes = [
  'NEW', 'ASSIGNED', 'INVESTIGATION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED',
  'DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED', 'ASSESSMENT', 'REPORT_DRAFT',
  'REPORT_SUBMITTED', 'CLIENT_REVIEW', 'CLARIFICATION_NEEDED', 'CLARIFICATION_PROVIDED',
  'SETTLEMENT', 'OFFER_SENT', 'FEE_INVOICED', 'PAYMENT_RECEIVED', 'CLOSED', 'CANCELLED',
] as const;

const ClaimRegistrySchema = z.object({
  claimNumber: optionalNullableString(100),
  policyId: optionalNullableId(),
  clientId: optionalNullableId(),
  insuranceCompanyId: optionalNullableId(),
  claimTypeId: optionalNullableId(),
  assignmentNumber: optionalNullableString(100),
  insurerClaimNumber: optionalNullableString(150),
  brokerId: optionalNullableId(),
  brokerReference: optionalNullableString(150),
  assignedByName: optionalNullableString(150),
  description: optionalNullableString(),
  natureOfLoss: optionalNullableString(),
  locationOfLoss: optionalNullableString(),
  classification: optionalNullableString(50),
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
  handlingAdjuster: optionalNullableString(100),
  policyNumber: optionalNullableString(100),
  policyType: optionalNullableString(100),
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
  clientId: optionalId(),
  engineerId: optionalId(),
  accountantId: optionalId(),
  insurerId: optionalId(),
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
