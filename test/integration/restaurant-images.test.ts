import { api } from '../helpers/http';
import { registerAndLogin, bearerHeader, AuthContext } from '../helpers/auth';
import { seedRestaurantWithOwner, SeededRestaurant } from '../helpers/db';

/**
 * Minimal valid 1×1 transparent PNG (67 bytes).
 * Used as a lightweight test payload for the file-upload endpoint.
 */
const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
    '+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Restaurant images endpoints', () => {
  describe('authentication and authorisation guards', () => {
    it('POST /restaurants/:id/images returns 401 without a token', async () => {
      await api
        .post('/restaurants/00000000-0000-0000-0000-000000000000/images')
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .expect(401);
    });

    it('POST /restaurants/:id/images returns 403 for a user without restaurant membership', async () => {
      const ctx = await registerAndLogin();

      const res = await api
        .post('/restaurants/00000000-0000-0000-0000-000000000000/images')
        .set(bearerHeader(ctx.accessToken))
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      // Guard rejects before reaching the controller — 403 Forbidden
      expect(res.status).toBe(403);
    });
  });

  describe('request validation', () => {
    let ctx: AuthContext;
    let seed: SeededRestaurant;

    beforeAll(async () => {
      ctx = await registerAndLogin();
      seed = await seedRestaurantWithOwner(ctx.userId);
    });

    afterAll(async () => {
      await seed.cleanup();
    });

    it('returns 400 when no file is attached', async () => {
      const res = await api
        .post(`/restaurants/${seed.restaurantId}/images`)
        .set(bearerHeader(ctx.accessToken))
        .field('is_cover', 'false');

      expect(res.status).toBe(400);
    });

    it('returns 400 for a disallowed MIME type', async () => {
      const textBuffer = Buffer.from('not an image');

      const res = await api
        .post(`/restaurants/${seed.restaurantId}/images`)
        .set(bearerHeader(ctx.accessToken))
        .attach('file', textBuffer, {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .field('is_cover', 'false');

      expect(res.status).toBe(400);
    });
  });

  describe('successful upload and delete flow', () => {
    let ctx: AuthContext;
    let seed: SeededRestaurant;
    let uploadedImageId: string;

    beforeAll(async () => {
      ctx = await registerAndLogin();
      seed = await seedRestaurantWithOwner(ctx.userId);
    });

    afterAll(async () => {
      await seed.cleanup();
    });

    it('POST uploads a valid image and returns image metadata (201)', async () => {
      const res = await api
        .post(`/restaurants/${seed.restaurantId}/images`)
        .set(bearerHeader(ctx.accessToken))
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .field('is_cover', 'true');

      expect(res.status).toBe(201);

      const body = res.body as {
        id: string;
        restaurant_id: string;
        image_key: string;
        is_cover: boolean;
      };

      expect(typeof body.id).toBe('string');
      expect(body.id.length).toBeGreaterThan(0);
      expect(body.restaurant_id).toBe(seed.restaurantId);
      expect(typeof body.image_key).toBe('string');
      expect(body.image_key.length).toBeGreaterThan(0);
      expect(body.is_cover).toBe(true);

      uploadedImageId = body.id;
    });

    it('DELETE removes the uploaded image and returns 204', async () => {
      // Depends on the upload test having run first
      expect(uploadedImageId).toBeDefined();

      await api
        .delete(`/restaurants/${seed.restaurantId}/images/${uploadedImageId}`)
        .set(bearerHeader(ctx.accessToken))
        .expect(204);
    });
  });
});
