import { z } from 'zod';
import {
  PaginationQuerySchema,
  optionalNullableId,
  optionalNullableString,
} from './index.js';

export const ListDocumentsQuerySchema = PaginationQuerySchema;

export const UploadDocumentSchema = z.object({
  documentCategoryId: optionalNullableId(),
  description: optionalNullableString(),
  isReceived: z.union([z.boolean(), z.enum(['true', 'false'])]).exactOptional(),
});
