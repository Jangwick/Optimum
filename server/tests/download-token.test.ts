import { createDownloadToken, verifyDownloadToken } from '../src/services/download-token.service.js';
import type { AuthUser } from '../src/middleware/auth.js';

const user: AuthUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ENGINEER',
};

describe('download-token service', () => {
  it('creates and verifies a resource-scoped token', () => {
    const resource = '/api/claims/1/documents/2/download';
    const token = createDownloadToken(user, resource);
    const payload = verifyDownloadToken(token, resource);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(user.id);
    expect(payload?.email).toBe(user.email);
    expect(payload?.resource).toBe(resource);
    expect(payload?.firstName).toBe(user.firstName);
  });

  it('rejects a token used for a different resource', () => {
    const token = createDownloadToken(user, '/api/claims/1/documents/2/download');
    const payload = verifyDownloadToken(token, '/api/claims/1/documents/3/download');
    expect(payload).toBeNull();
  });

  it('rejects an invalid token', () => {
    expect(verifyDownloadToken('not-a-token', '/api/claims/1/documents/2/download')).toBeNull();
  });
});
