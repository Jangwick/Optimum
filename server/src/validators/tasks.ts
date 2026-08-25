import { z } from 'zod';
import {
  optionalString,
  optionalNullableString,
  optionalId,
  requiredId,
  PaginationQuerySchema,
} from './index.js';

export const ListTasksQuerySchema = z.object({
  claimId: optionalId(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).exactOptional(),
}).merge(PaginationQuerySchema);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: optionalString(),
  claimId: optionalId(),
  assignedToId: requiredId(),
  dueDate: optionalNullableString(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).exactOptional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).exactOptional(),
  description: optionalString(),
  claimId: optionalId(),
  assignedToId: requiredId().exactOptional(),
  dueDate: optionalNullableString(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).exactOptional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).exactOptional(),
});
