import { z } from 'zod';
import {
  optionalString,
  optionalNullableString,
  optionalNumber,
  optionalId,
  requiredNumber,
  toNumber,
} from './index.js';

export const CreateFeeSchema = z.object({
  userId: optionalId(),
  feeType: z.string().min(1, 'Fee type is required'),
  amount: requiredNumber(),
  description: optionalString(),
});

export const UpdateFeeSchema = z.object({
  userId: optionalId(),
  feeType: z.string().min(1).exactOptional(),
  amount: optionalNumber(),
  description: optionalString(),
});

export const CreateInvoiceSchema = z.object({
  feeIds: z.array(z.preprocess(toNumber, z.number().int().positive())).exactOptional(),
  dueDate: optionalNullableString(),
  notes: optionalString(),
});

export const PaymentSchema = z.object({
  amount: requiredNumber(),
  paymentDate: optionalString(),
  method: optionalString(),
  reference: optionalString(),
  notes: optionalString(),
});

export const UpsertSettlementSchema = z.object({
  settlementDate: optionalNullableString(),
  settledAmount: optionalNumber(),
  status: z.enum(['PENDING', 'AGREED', 'REJECTED', 'CANCELLED']).exactOptional(),
  notes: optionalString(),
});

export const CreateOfferSchema = z.object({
  offerDate: optionalString(),
  offeredAmount: optionalNumber(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED']).exactOptional(),
  notes: optionalString(),
});

export const OfferResponseSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COUNTERED']),
  notes: optionalString(),
});
