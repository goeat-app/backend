import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { api } from '../helpers/http';
import { bearerHeader, registerAndLogin, AuthContext } from '../helpers/auth';
import { seedRestaurantWithOwner, SeededRestaurant } from '../helpers/db';

function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for restaurant menu tests.');
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

describe('Restaurant menu editing endpoints', () => {
  let client: Client;
  let seededRestaurants: SeededRestaurant[] = [];

  beforeAll(async () => {
    client = createClient();
    await client.connect();
  });

  beforeEach(() => {
    seededRestaurants = [];
  });

  afterEach(async () => {
    for (const seeded of seededRestaurants) {
      await seeded.cleanup();
    }
  });

  afterAll(async () => {
    await client.end();
  });

  it('PATCH /restaurants/:restaurantId/menu/categories/:categoryId returns 401 without token', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Drinks',
    );

    await api
      .patch(
        `/restaurants/${seeded.restaurantId}/menu/categories/${categoryId}`,
      )
      .send({ name: 'Hot Drinks' })
      .expect(401);
  });

  it('PATCH /restaurants/:restaurantId/menu/categories/:categoryId returns 403 for non-member user', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const outsiderCtx = await registerAndLogin();
    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Drinks',
    );

    await api
      .patch(
        `/restaurants/${seeded.restaurantId}/menu/categories/${categoryId}`,
      )
      .set(bearerHeader(outsiderCtx.accessToken))
      .send({ name: 'Hot Drinks' })
      .expect(403);
  });

  it('PATCH /restaurants/:restaurantId/menu/categories/:categoryId updates category for OWNER', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Drinks',
    );

    const res = await api
      .patch(
        `/restaurants/${seeded.restaurantId}/menu/categories/${categoryId}`,
      )
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        name: 'Hot Drinks',
        slug: 'hot-drinks',
        sort_order: 2,
      });

    expect([200, 204]).toContain(res.status);

    const { rows } = await client.query(
      'SELECT name, slug, sort_order FROM menu_categories WHERE id = $1',
      [categoryId],
    );

    const categoryRows = rows as Array<{
      name: string;
      slug: string;
      sort_order: number;
    }>;

    expect(categoryRows).toHaveLength(1);
    expect(categoryRows[0].name).toBe('Hot Drinks');
    expect(categoryRows[0].slug).toBe('hot-drinks');
    expect(categoryRows[0].sort_order).toBe(2);
  });

  it('PATCH /restaurants/:restaurantId/menu/categories/:categoryId returns 409 for duplicate active name', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    await insertCategory(client, seeded.restaurantId, 'Drinks');
    const secondCategoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Desserts',
    );

    await api
      .patch(
        `/restaurants/${seeded.restaurantId}/menu/categories/${secondCategoryId}`,
      )
      .set(bearerHeader(ownerCtx.accessToken))
      .send({ name: 'Drinks' })
      .expect(409);
  });

  it('PATCH /restaurants/:restaurantId/menu/items/:itemId updates item fields for OWNER', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const mainsId = await insertCategory(client, seeded.restaurantId, 'Mains');
    const specialsId = await insertCategory(
      client,
      seeded.restaurantId,
      'Specials',
    );
    const itemId = await insertItem(
      client,
      seeded.restaurantId,
      mainsId,
      'Feijoada',
    );

    const res = await api
      .patch(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        category_id: specialsId,
        description: 'Saturday special',
        base_price: 49.9,
        has_sizes: false,
      });

    expect([200, 204]).toContain(res.status);

    const { rows } = await client.query(
      'SELECT category_id, description, base_price, has_sizes FROM menu_items WHERE id = $1',
      [itemId],
    );

    const itemRows = rows as Array<{
      category_id: string;
      description: string;
      base_price: string;
      has_sizes: boolean;
    }>;

    expect(itemRows).toHaveLength(1);
    expect(itemRows[0].category_id).toBe(specialsId);
    expect(itemRows[0].description).toBe('Saturday special');
    expect(itemRows[0].base_price).toBe('49.90');
    expect(itemRows[0].has_sizes).toBe(false);
  });

  it('PATCH /restaurants/:restaurantId/menu/items/:itemId returns 400 when has_sizes=false and base_price is missing', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
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

    await api
      .patch(`/restaurants/${seeded.restaurantId}/menu/items/${itemId}`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        has_sizes: false,
        base_price: null,
      })
      .expect(400);
  });

  it('PATCH /restaurants/:restaurantId/menu/items/:itemId returns 400 when category belongs to another restaurant', async () => {
    const ownerA = await registerAndLogin();
    const ownerB = await registerAndLogin();

    const seedA = await seedRestaurantWithOwner(ownerA.userId);
    const seedB = await seedRestaurantWithOwner(ownerB.userId);
    seededRestaurants.push(seedA, seedB);

    const categoryA = await insertCategory(client, seedA.restaurantId, 'Mains');
    const categoryB = await insertCategory(
      client,
      seedB.restaurantId,
      'Other Rest Category',
    );
    const itemId = await insertItem(
      client,
      seedA.restaurantId,
      categoryA,
      'Dish A',
    );

    await api
      .patch(`/restaurants/${seedA.restaurantId}/menu/items/${itemId}`)
      .set(bearerHeader(ownerA.accessToken))
      .send({ category_id: categoryB })
      .expect(400);
  });

  it('PATCH /restaurants/:restaurantId/menu/items/:itemId/availability toggles item availability', async () => {
    const ownerCtx: AuthContext = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Pizza',
    );
    const itemId = await insertItem(
      client,
      seeded.restaurantId,
      categoryId,
      'Margherita',
    );

    const res = await api
      .patch(
        `/restaurants/${seeded.restaurantId}/menu/items/${itemId}/availability`,
      )
      .set(bearerHeader(ownerCtx.accessToken))
      .send({ is_available: false });

    expect([200, 204]).toContain(res.status);

    const { rows } = await client.query(
      'SELECT is_available FROM menu_items WHERE id = $1',
      [itemId],
    );

    const itemRows = rows as Array<{ is_available: boolean }>;
    expect(itemRows).toHaveLength(1);
    expect(itemRows[0].is_available).toBe(false);
  });
});
