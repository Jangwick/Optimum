import { z } from 'zod';
import { optionalString, optionalId } from './index.js';

export const ExportClaimsQuerySchema = z.object({
  search: optionalString(),
  status: optionalString(),
  processStatus: optionalString(),
  claimType: optionalString(),
  clientId: optionalId(),
  engineerId: optionalId(),
  insurerId: optionalId(),
  view: z.enum(['active', 'closed', 'cancelled']).exactOptional(),
});
