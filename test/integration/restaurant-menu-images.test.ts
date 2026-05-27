import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { api } from '../helpers/http';
import { bearerHeader, registerAndLogin, AuthContext } from '../helpers/auth';
import { seedRestaurantWithOwner, SeededRestaurant } from '../helpers/db';

const MINIMAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk' +
    '+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required for restaurant menu image tests.',
    );
  }

  return new Client({ connectionString, ssl: false });
}

async function insertCategory(
  client: Client,
  restaurantId: string,
  name: string,
): Promise<string> {
  const id = randomUUID();
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  await client.query(
    `
      INSERT INTO menu_categories (id, restaurant_id, name, slug, sort_order, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, true, now(), now())
    `,
    [id, restaurantId, name, slug],
  );

  return id;
}

async function insertItem(
  client: Client,
  restaurantId: string,
  categoryId: string,
  name: string,
): Promise<string> {
  const id = randomUUID();

  await client.query(
    `
      INSERT INTO menu_items
        (id, restaurant_id, category_id, name, description, base_price, is_available, has_sizes, sort_order, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, 'seed item', 10.50, true, false, 0, now(), now())
    `,
    [id, restaurantId, categoryId, name],
  );

  return id;
}

describe('Restaurant menu item images endpoints', () => {
  let client: Client;
  const seededRestaurants: SeededRestaurant[] = [];

  beforeAll(async () => {
    client = createClient();
    await client.connect();
  });

  afterEach(async () => {
    while (seededRestaurants.length > 0) {
      const seeded = seededRestaurants.pop();
      if (seeded) {
        await seeded.cleanup();
      }
    }
  });

  afterAll(async () => {
    await client.end();
  });

  describe('auth guards and validation', () => {
    it('POST returns 401 without a token', async () => {
      await api
        .post(
          '/restaurants/00000000-0000-0000-0000-000000000000/menu/items/00000000-0000-0000-0000-000000000000/image',
        )
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .expect(401);
    });

    it('POST returns 403 for a user without restaurant membership', async () => {
      const ctx = await registerAndLogin();

      const res = await api
        .post(
          '/restaurants/00000000-0000-0000-0000-000000000000/menu/items/00000000-0000-0000-0000-000000000000/image',
        )
        .set(bearerHeader(ctx.accessToken))
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(403);
    });

    it('POST returns 400 when no file is attached', async () => {
      const ctx = await registerAndLogin();
      const seeded = await seedRestaurantWithOwner(ctx.userId);
      seededRestaurants.push(seeded);

      const categoryId = await insertCategory(
        client,
        seeded.restaurantId,
        'Mains',
      );
      const itemId = await insertItem(
        client,
        seeded.restaurantId,
        categoryId,
        'Feijoada',
      );

      const res = await api
        .post(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}/image`)
        .set(bearerHeader(ctx.accessToken));

      expect(res.status).toBe(400);
    });

    it('POST returns 400 for a disallowed MIME type', async () => {
      const ctx = await registerAndLogin();
      const seeded = await seedRestaurantWithOwner(ctx.userId);
      seededRestaurants.push(seeded);

      const categoryId = await insertCategory(
        client,
        seeded.restaurantId,
        'Mains',
      );
      const itemId = await insertItem(
        client,
        seeded.restaurantId,
        categoryId,
        'Feijoada',
      );
      const textBuffer = Buffer.from('not an image');

      const res = await api
        .post(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}/image`)
        .set(bearerHeader(ctx.accessToken))
        .attach('file', textBuffer, {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('upload, replacement and delete flow', () => {
    it('POST stores an image_key under the menu_items folder and DELETE clears it', async () => {
      const ctx: AuthContext = await registerAndLogin();
      const seeded = await seedRestaurantWithOwner(ctx.userId);
      seededRestaurants.push(seeded);

      const categoryId = await insertCategory(
        client,
        seeded.restaurantId,
        'Mains',
      );
      const itemId = await insertItem(
        client,
        seeded.restaurantId,
        categoryId,
        'Feijoada',
      );

      const uploadRes = await api
        .post(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}/image`)
        .set(bearerHeader(ctx.accessToken))
        .attach('file', MINIMAL_PNG, {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(uploadRes.status).toBe(201);

      const uploadBody = uploadRes.body as {
        id: string;
        image_key: string | null;
        restaurant_id: string;
      };

      expect(uploadBody.restaurant_id).toBe(seeded.restaurantId);
      expect(typeof uploadBody.image_key).toBe('string');
      expect(uploadBody.image_key).toContain(
        `${seeded.restaurantId}/menu_items/${itemId}/`,
      );

      const firstImageKey = uploadBody.image_key;

      const { rows: afterUploadRows } = await client.query(
        'SELECT image_key FROM menu_items WHERE id = $1',
        [itemId],
      );

      expect(afterUploadRows).toHaveLength(1);
      expect(afterUploadRows[0].image_key).toBe(firstImageKey);

      const replacementRes = await api
        .post(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}/image`)
        .set(bearerHeader(ctx.accessToken))
        .attach('file', MINIMAL_PNG, {
          filename: 'replacement.png',
          contentType: 'image/png',
        });

      expect(replacementRes.status).toBe(201);
      const replacementBody = replacementRes.body as {
        image_key: string | null;
      };
      expect(typeof replacementBody.image_key).toBe('string');
      expect(replacementBody.image_key).not.toBe(firstImageKey);

      const { rows: afterReplacementRows } = await client.query(
        'SELECT image_key FROM menu_items WHERE id = $1',
        [itemId],
      );

      expect(afterReplacementRows).toHaveLength(1);
      expect(afterReplacementRows[0].image_key).toBe(replacementBody.image_key);

      await api
        .delete(
          `/restaurants/${seeded.restaurantId}/menu/items/${itemId}/image`,
        )
        .set(bearerHeader(ctx.accessToken))
        .expect(204);

      const { rows: afterDeleteRows } = await client.query(
        'SELECT image_key FROM menu_items WHERE id = $1',
        [itemId],
      );

      expect(afterDeleteRows).toHaveLength(1);
      expect(afterDeleteRows[0].image_key).toBeNull();
    });
  });
});
