import { api } from '../helpers/http';
import { createTestIdentity } from '../helpers/identity';
import {
  bearerHeader,
  createFirebaseToken,
  registerAndLogin,
} from '../helpers/auth';
import { Client } from 'pg';

function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for auth integration tests.');
  }

  return new Client({ connectionString, ssl: false });
}

async function createLegacyUser(email: string): Promise<{ id: string }> {
  const client = createClient();
  await client.connect();

  try {
    const result = await client.query(
      `
      INSERT INTO "user" (name, email, password, phone, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, now(), now())
      RETURNING id
      `,
      ['Legacy User', email, 'hashed-password', ''],
    );

    return { id: String((result.rows[0] as { id: unknown }).id) };
  } finally {
    await client.end();
  }
}

describe('Auth endpoints', () => {
  describe('GET /auth/me', () => {
    let accessToken: string;
    let userId: string;
    let email: string;

    beforeAll(async () => {
      const ctx = await registerAndLogin();
      accessToken = ctx.accessToken;
      userId = ctx.userId;
      email = ctx.email;
    });

    it('returns the authenticated user profile', async () => {
      const res = await api
        .get('/auth/me')
        .set(bearerHeader(accessToken))
        .expect(200);

      const bodyResponse = res.body as {
        id: string;
        email: string;
      };

      expect(bodyResponse.id).toBe(userId);
      expect(bodyResponse.email).toBe(email.toLowerCase());
      expect(bodyResponse).not.toHaveProperty('password');
    });

    it('returns 401 without a token', async () => {
      await api.get('/auth/me').expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await api
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('returns 401 with Token expired for expired Firebase token', async () => {
      const res = await api
        .get('/auth/me')
        .set('Authorization', 'Bearer expired.token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token expired' });
    });

    it('returns 503 when Firebase verification is unavailable', async () => {
      const res = await api
        .get('/auth/me')
        .set('Authorization', 'Bearer service.unavailable');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({ message: 'Auth service unavailable' });
    });
  });

  describe('first sign-in provisioning and linking', () => {
    it('returns 403 when Firebase token has no email claim', async () => {
      const accessToken = createFirebaseToken({
        uid: `firebase-no-email-${Date.now()}`,
      });

      const res = await api.get('/auth/me').set(bearerHeader(accessToken));

      expect(res.status).toBe(403);
      expect((res.body as { message: string }).message).toBe(
        'Email-based identity required.',
      );
    });

    it('creates a user on first login and reuses the same user on repeat login', async () => {
      const identity = createTestIdentity();
      const uid = `firebase-provision-${Date.now()}`;
      const accessToken = createFirebaseToken({
        uid,
        email: identity.email,
        email_verified: true,
        name: identity.name,
      });

      const firstRes = await api
        .get('/auth/me')
        .set(bearerHeader(accessToken))
        .expect(200);

      const secondRes = await api
        .get('/auth/me')
        .set(bearerHeader(accessToken))
        .expect(200);

      const responseBody = firstRes.body as { id: string; email: string };

      expect(responseBody.id).toBe((secondRes.body as { id: string }).id);
      expect(responseBody.email).toBe(identity.email.toLowerCase());
    });

    it('links existing user by email when email is verified', async () => {
      const identity = createTestIdentity();
      const existing = await createLegacyUser(identity.email.toLowerCase());
      const accessToken = createFirebaseToken({
        uid: `firebase-link-${Date.now()}`,
        email: identity.email,
        email_verified: true,
      });

      const res = await api
        .get('/auth/me')
        .set(bearerHeader(accessToken))
        .expect(200);

      expect((res.body as { id: string }).id).toBe(existing.id);

      const repeated = await api
        .get('/auth/me')
        .set(bearerHeader(accessToken))
        .expect(200);

      expect((repeated.body as { id: string }).id).toBe(existing.id);
    });
  });
});
