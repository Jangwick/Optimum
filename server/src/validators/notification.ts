import { z } from 'zod';
import { PaginationQuerySchema } from './index.js';

export const ListNotificationsQuerySchema = PaginationQuerySchema.merge(
  z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
);
