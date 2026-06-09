import { randomUUID } from 'crypto';
import { Client } from 'pg';

/**
 * Known UUIDs from the seed migration (20260517120000-seed-food-and-place-types).
 * These must exist in the target DB before restaurant seeding.
 */
const SEEDED_FOOD_TYPE_ID = 'aca794b3-cafc-4f0e-be34-fd3ecec1b8e8'; // Brasileira
const SEEDED_PLACE_TYPE_ID = '25f31cd6-79b4-4a43-bc31-f0edc1e57ee8'; // Bistrô

export interface SeededRestaurant {
  restaurantId: string;
  /**
   * Deletes the restaurant row, its role assignments, and any image records
   * created during the test run. Call this in afterAll.
   */
  cleanup: () => Promise<void>;
}

function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required for DB seeding in integration tests.',
    );
  }
  return new Client({ connectionString, ssl: false });
}

/**
 * Inserts a fake restaurant + OWNER membership for the given user directly
 * into the database, bypassing the API (which requires an existing role to
 * bootstrap). Call cleanup() in afterAll to remove all seeded rows.
 */
export async function seedRestaurantWithOwner(
  userId: string,
): Promise<SeededRestaurant> {
  const client = createClient();
  await client.connect();

  const restaurantId = randomUUID();
  const roleId = randomUUID();
  const restaurantName = `Restaurante Teste ${restaurantId.slice(0, 8)}`;

  try {
    await client.query(
      `
      INSERT INTO restaurants
        (id, name, slug, place_type_id, food_type_id, average_rating, total_reviews,
         average_price, address, city, state, postal_code, latitude, longitude, is_active)
      VALUES
        ($1, $2, $3, $4, $5, 4.5, 10, 50, 'Rua de Teste, 123', 'São Paulo', 'SP',
         '01310-100', -23.5505, -46.6333, true)
      `,
      [
        restaurantId,
        restaurantName,
        restaurantName.toLowerCase().replace(/\s+/g, '-'),
        SEEDED_PLACE_TYPE_ID,
        SEEDED_FOOD_TYPE_ID,
      ],
    );

    await client.query(
      `
      INSERT INTO restaurant_user_roles (id, restaurant_id, user_id, role, created_at, updated_at)
      VALUES ($1, $2, $3, 'OWNER', now(), now())
      `,
      [roleId, restaurantId, userId],
    );
  } finally {
    await client.end();
  }

  return {
    restaurantId,
    cleanup: async () => {
      const cleanClient = createClient();
      await cleanClient.connect();
      try {
        await cleanClient.query(
          'DELETE FROM restaurant_images WHERE restaurant_id = $1',
          [restaurantId],
        );
        await cleanClient.query(
          'DELETE FROM restaurant_user_roles WHERE restaurant_id = $1',
          [restaurantId],
        );
        await cleanClient.query('DELETE FROM restaurants WHERE id = $1', [
          restaurantId,
        ]);
      } finally {
        await cleanClient.end();
      }
    },
  };
}
