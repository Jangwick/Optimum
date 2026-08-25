import { z } from 'zod';
import { optionalNullableString, optionalNullableId, optionalString } from './index.js';

export const CreateInspectionSchema = z.object({
  scheduledAt: optionalNullableString(),
  conductedAt: optionalNullableString(),
  location: optionalNullableString(),
  findings: optionalNullableString(),
  notes: optionalNullableString(),
  inspectorId: optionalNullableId(),
});

export const UpdateInspectionSchema = CreateInspectionSchema;

export const InspectionPhotoCaptionSchema = z.object({
  caption: optionalString(),
});
