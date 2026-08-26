import { assertClaimAccess } from '../src/services/claim.service.js';
import type { AuthUser } from '../src/middleware/auth.js';
import { AppError } from '../src/middleware/error.js';

const admin: AuthUser = { id: 1, email: 'admin@example.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' };
const engineer: AuthUser = { id: 2, email: 'eng@example.com', firstName: 'Eng', lastName: 'User', role: 'ENGINEER' };
const accountant: AuthUser = { id: 3, email: 'acc@example.com', firstName: 'Acc', lastName: 'User', role: 'ACCOUNTANT' };
const other: AuthUser = { id: 4, email: 'other@example.com', firstName: 'Other', lastName: 'User', role: 'ENGINEER' };

describe('assertClaimAccess', () => {
  it('allows ADMIN for any claim', () => {
    expect(() => assertClaimAccess(admin, { engineerId: 99, accountantId: 99, createdById: 99 })).not.toThrow();
  });

  it('allows ENGINEER assigned to the claim', () => {
    expect(() => assertClaimAccess(engineer, { engineerId: 2, accountantId: 3, createdById: 4 })).not.toThrow();
  });

  it('allows ACCOUNTANT assigned to the claim', () => {
    expect(() => assertClaimAccess(accountant, { engineerId: 2, accountantId: 3, createdById: 4 })).not.toThrow();
  });

  it('allows the user who created the claim', () => {
    expect(() => assertClaimAccess(other, { engineerId: 2, accountantId: 3, createdById: 4 })).not.toThrow();
  });

  it('denies ENGINEER not assigned to the claim', () => {
    expect(() => assertClaimAccess(engineer, { engineerId: 99, accountantId: 99, createdById: 99 })).toThrow(AppError);
  });

  it('denies access when claim is missing', () => {
    expect(() => assertClaimAccess(engineer, null)).toThrow(AppError);
  });
});
