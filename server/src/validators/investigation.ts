import { z } from 'zod';
import { optionalString, optionalNullableString } from './index.js';

export const CreateInvestigationSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  findings: optionalString(),
  startedAt: optionalString(),
  completedAt: optionalNullableString(),
});

export const UpdateInvestigationSchema = z.object({
  summary: z.string().min(1).exactOptional(),
  findings: optionalString(),
  startedAt: optionalString(),
  completedAt: optionalNullableString(),
});
