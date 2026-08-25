import { z } from 'zod';
import { optionalNumber, optionalString } from './index.js';

export const AssessmentItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: optionalNumber(),
  unitCost: optionalNumber(),
  amount: optionalNumber(),
});

export const CreateAssessmentSchema = z.object({
  assessmentDate: optionalString(),
  items: z.array(AssessmentItemSchema).exactOptional(),
  depreciation: optionalNumber(),
  notes: optionalString(),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema;
