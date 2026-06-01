import { api } from './http';
import { createTestIdentity, TestIdentity } from './identity';

export interface AuthContext {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  identity: TestIdentity;
}

/**
 * Registers a unique user via the API, then fetches their profile to
 * resolve the user ID. Returns the full auth context for downstream tests.
 */
export async function registerAndLogin(): Promise<AuthContext> {
  const identity = createTestIdentity();

  const registerRes = await api.post('/auth/register').send(identity);

  if (registerRes.status !== 201) {
    throw new Error(
      `Registration failed (${registerRes.status}): ${JSON.stringify(registerRes.body)}`,
    );
  }

  const { accessToken, refreshToken } = registerRes.body as {
    accessToken: string;
    refreshToken: string;
  };

  const meRes = await api
    .get('/auth/me')
    .set('Authorization', `Bearer ${accessToken}`);

  if (meRes.status !== 200) {
    throw new Error(
      `GET /auth/me failed (${meRes.status}): ${JSON.stringify(meRes.body)}`,
    );
  }

  return {
    userId: (meRes.body as { id: string }).id,
    email: identity.email,
    accessToken,
    refreshToken,
    identity,
  };
}

/** Returns the Authorization header object for a bearer token. */
export function bearerHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
