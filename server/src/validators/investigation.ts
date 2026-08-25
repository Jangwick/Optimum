import { z } from 'zod';
import { optionalString, optionalNullableString, PaginationQuerySchema } from './index.js';

export const CreateInvestigationSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  findings: optionalString(),
  startedAt: optionalString(),
  completedAt: optionalNullableString(),
});

export const ListInvestigationsQuerySchema = PaginationQuerySchema;

export const UpdateInvestigationSchema = z.object({
  summary: z.string().min(1).exactOptional(),
  findings: optionalString(),
  startedAt: optionalString(),
  completedAt: optionalNullableString(),
});
