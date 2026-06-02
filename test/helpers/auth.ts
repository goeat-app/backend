import { api } from './http';
import { createTestIdentity, TestIdentity } from './identity';

export interface AuthContext {
  userId: string;
  email: string;
  accessToken: string;
  identity: TestIdentity;
}

type FirebaseTokenClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  phone_number?: string;
};

export function createFirebaseToken(claims: FirebaseTokenClaims): string {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `test-firebase.${payload}`;
}

/**
 * Uses a Firebase-like token and calls /auth/me once so the backend
 * resolves/provisions the internal user row before downstream tests.
 */
export async function registerAndLogin(): Promise<AuthContext> {
  const identity = createTestIdentity();
  const accessToken = createFirebaseToken({
    uid: `firebase-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: identity.email,
    email_verified: true,
    name: identity.name,
    phone_number: identity.phone,
  });

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
    identity,
  };
}

/** Returns the Authorization header object for a bearer token. */
export function bearerHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
