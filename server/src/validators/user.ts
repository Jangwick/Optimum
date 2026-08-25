import { z } from 'zod';
import { PaginationQuerySchema, optionalString } from './index.js';

export const ListUsersQuerySchema = PaginationQuerySchema.extend({
  role: optionalString(),
  sortField: optionalString(),
  sortOrder: z.enum(['asc', 'desc']).exactOptional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email().min(1, 'Email is required'),
  password: optionalString(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: optionalString(),
  employeeNumber: optionalString(),
  department: optionalString(),
  designation: optionalString(),
  role: z.string().min(1, 'Role is required'),
  isActive: z.boolean().exactOptional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().exactOptional(),
  password: optionalString(),
  firstName: z.string().min(1).exactOptional(),
  lastName: z.string().min(1).exactOptional(),
  phone: optionalString(),
  employeeNumber: optionalString(),
  department: optionalString(),
  designation: optionalString(),
  role: z.string().exactOptional(),
  isActive: z.boolean().exactOptional(),
});
