import { z } from 'zod';
import { optionalNullableId, optionalNullableString } from './index.js';

export const UploadDocumentSchema = z.object({
  documentCategoryId: optionalNullableId(),
  description: optionalNullableString(),
  isReceived: z.union([z.boolean(), z.enum(['true', 'false'])]).exactOptional(),
});
