import { api } from '../helpers/http';
import { createTestIdentity } from '../helpers/identity';
import { registerAndLogin, bearerHeader } from '../helpers/auth';

describe('Auth endpoints', () => {
  describe('POST /auth/register', () => {
    it('creates a new user and returns access + refresh tokens', async () => {
      const identity = createTestIdentity();

      const res = await api.post('/auth/register').send(identity);

      const bodyResponse = res.body as {
        accessToken: string;
        refreshToken: string;
      };

      expect(res.status).toBe(201);
      expect(typeof bodyResponse.accessToken).toBe('string');
      expect(bodyResponse.accessToken.length).toBeGreaterThan(0);
      expect(typeof bodyResponse.refreshToken).toBe('string');
      expect(bodyResponse.refreshToken.length).toBeGreaterThan(0);
    });

    it('returns 409 when registering with an already-used email', async () => {
      const identity = createTestIdentity();

      await api.post('/auth/register').send(identity).expect(201);

      const res = await api.post('/auth/register').send(identity);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      const identity = createTestIdentity();
      await api.post('/auth/register').send(identity).expect(201);

      const res = await api
        .post('/auth/login')
        .send({ email: identity.email, password: identity.password });

      const bodyResponse = res.body as {
        accessToken: string;
        refreshToken: string;
      };

      expect(res.status).toBe(200);
      expect(typeof bodyResponse.accessToken).toBe('string');
      expect(typeof bodyResponse.refreshToken).toBe('string');
    });

    it('returns 401 for wrong password', async () => {
      const identity = createTestIdentity();
      await api.post('/auth/register').send(identity).expect(201);

      const res = await api
        .post('/auth/login')
        .send({ email: identity.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await api.post('/auth/login').send({
        email: `nonexistent.${Date.now()}@integration.test`,
        password: 'whatever',
      });

      expect(res.status).toBe(401);
    });
  });

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
  });

  describe('POST /auth/refresh', () => {
    it('returns new access + refresh tokens given a valid refresh token', async () => {
      const ctx = await registerAndLogin();

      const res = await api
        .post('/auth/refresh')
        .send({ refreshToken: ctx.refreshToken });

      const bodyResponse = res.body as {
        accessToken: string;
        refreshToken: string;
      };

      expect(res.status).toBe(200);
      expect(typeof bodyResponse.accessToken).toBe('string');
      expect(typeof bodyResponse.refreshToken).toBe('string');
    });

    it('returns 401 for an invalid refresh token', async () => {
      const res = await api
        .post('/auth/refresh')
        .send({ refreshToken: 'not.a.valid.jwt' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns success message and clears the session', async () => {
      const ctx = await registerAndLogin();

      const res = await api
        .post('/auth/logout')
        .set(bearerHeader(ctx.accessToken))
        .expect(200);

      const bodyResponse = res.body as {
        message: string;
      };

      expect(bodyResponse.message).toBe('Logged out successfully');
    });

    it('returns 401 without a token', async () => {
      await api.post('/auth/logout').expect(401);
    });
  });
});
