import { api } from '../helpers/http';
import { registerAndLogin, bearerHeader, AuthContext } from '../helpers/auth';
import { seedRestaurantWithOwner, SeededRestaurant } from '../helpers/db';

describe('My restaurants endpoint — GET /restaurants/me', () => {
  describe('authentication guard', () => {
    it('returns 401 without a token', async () => {
      await api.get('/restaurants/me').expect(401);
    });

    it('returns 401 with an invalid token', async () => {
      await api
        .get('/restaurants/me')
        .set('Authorization', 'Bearer invalid.jwt.here')
        .expect(401);
    });
  });

  describe('authenticated user with no restaurant membership', () => {
    let ctx: AuthContext;

    beforeAll(async () => {
      ctx = await registerAndLogin();
    });

    it('returns an empty array when the user has no restaurants', async () => {
      const res = await api
        .get('/restaurants/me')
        .set(bearerHeader(ctx.accessToken))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('authenticated OWNER with a seeded restaurant', () => {
    let ctx: AuthContext;
    let seed: SeededRestaurant;

    beforeAll(async () => {
      ctx = await registerAndLogin();
      seed = await seedRestaurantWithOwner(ctx.userId);
    });

    afterAll(async () => {
      await seed.cleanup();
    });

    it('returns a non-empty array that includes the seeded restaurant', async () => {
      const res = await api
        .get('/restaurants/me')
        .set(bearerHeader(ctx.accessToken))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);

      const found = (res.body as Array<{ id: string }>).find(
        (r) => r.id === seed.restaurantId,
      );
      expect(found).toBeDefined();
    });

    it('each restaurant entry has the expected fields', async () => {
      const res = await api
        .get('/restaurants/me')
        .set(bearerHeader(ctx.accessToken))
        .expect(200);

      const restaurant = (res.body as Array<Record<string, unknown>>).find(
        (r) => r['id'] === seed.restaurantId,
      );

      expect(restaurant).toBeDefined();
      expect(typeof restaurant!['id']).toBe('string');
      expect(typeof restaurant!['name']).toBe('string');
      expect(restaurant!['role']).toBe('OWNER');
      expect(typeof restaurant!['placeType']).toBe('string');
      expect(typeof restaurant!['foodType']).toBe('string');
      expect(typeof restaurant!['priceLevel']).toBe('number');
      expect(typeof restaurant!['avgRating']).toBe('number');
      expect(typeof restaurant!['address']).toBe('string');
      expect(typeof restaurant!['city']).toBe('string');
      expect(typeof restaurant!['state']).toBe('string');
    });
  });
});
