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

  it('GET /restaurants/:restaurantId/menu returns categories and items overview', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Mains',
    );
    await insertItem(client, seeded.restaurantId, categoryId, 'Feijoada');

    const res = await api
      .get(`/restaurants/${seeded.restaurantId}/menu`)
      .set(bearerHeader(ownerCtx.accessToken))
      .expect(200);

    const bodyResponse = res.body as {
      categories: Array<{
        id: string;
        name: string;
        slug: string;
        sort_order: number;
      }>;
      items: Array<{
        id: string;
        category_id: string;
        name: string;
        description: string;
        base_price: number;
        has_sizes: boolean;
        is_available: boolean;
        sort_order: number;
      }>;
    };

    expect(Array.isArray(bodyResponse.categories)).toBe(true);
    expect(Array.isArray(bodyResponse.items)).toBe(true);
    expect(bodyResponse.categories).toHaveLength(1);
    expect(bodyResponse.items).toHaveLength(1);
  });

  it('POST /restaurants/:restaurantId/menu/categories creates a category', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const res = await api
      .post(`/restaurants/${seeded.restaurantId}/menu/categories`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        name: 'Drinks',
      })
      .expect(201);

    const bodyResponse = res.body as {
      id: string;
      name: string;
      slug: string;
    };

    expect(bodyResponse.name).toBe('Drinks');
    expect(typeof bodyResponse.slug).toBe('string');

    const { rows } = await client.query(
      'SELECT name FROM menu_categories WHERE id = $1',
      [bodyResponse.id],
    );

    expect(rows).toHaveLength(1);
  });

  it('PATCH /restaurants/:restaurantId/menu/categories/reorder updates sort order', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const firstId = await insertCategory(client, seeded.restaurantId, 'First');
    const secondId = await insertCategory(
      client,
      seeded.restaurantId,
      'Second',
    );

    const res = await api
      .patch(`/restaurants/${seeded.restaurantId}/menu/categories/reorder`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        ordered_ids: [secondId, firstId],
      })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    const { rows } = await client.query(
      'SELECT id, sort_order FROM menu_categories WHERE id = ANY($1::uuid[]) ORDER BY sort_order ASC',
      [[secondId, firstId]],
    );

    const orderedRows = rows as Array<{ id: string; sort_order: number }>;
    expect(orderedRows[0].id).toBe(secondId);
    expect(orderedRows[0].sort_order).toBe(0);
    expect(orderedRows[1].id).toBe(firstId);
    expect(orderedRows[1].sort_order).toBe(1);
  });

  it('DELETE /restaurants/:restaurantId/menu/categories/:categoryId soft-deletes category and its items', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Seasonal',
    );
    const itemId = await insertItem(
      client,
      seeded.restaurantId,
      categoryId,
      'Pumpkin Soup',
    );

    await api
      .delete(
        `/restaurants/${seeded.restaurantId}/menu/categories/${categoryId}`,
      )
      .set(bearerHeader(ownerCtx.accessToken))
      .expect(200);

    const categoryRows = await client.query(
      'SELECT deleted_at, is_active FROM menu_categories WHERE id = $1',
      [categoryId],
    );
    const itemRows = await client.query(
      'SELECT deleted_at, is_available FROM menu_items WHERE id = $1',
      [itemId],
    );

    expect(categoryRows.rows[0].deleted_at).not.toBeNull();
    expect(categoryRows.rows[0].is_active).toBe(false);
    expect(itemRows.rows[0].deleted_at).not.toBeNull();
    expect(itemRows.rows[0].is_available).toBe(false);
  });

  it('POST /restaurants/:restaurantId/menu/items creates an item and GET /items lists it', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Burgers',
    );

    const createRes = await api
      .post(`/restaurants/${seeded.restaurantId}/menu/items`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        category_id: categoryId,
        name: 'House Burger',
        description: 'Double cheese',
        base_price: 39.9,
        has_sizes: false,
        is_available: true,
      })
      .expect(201);

    const createBody = createRes.body as {
      id: string;
      name: string;
      slug: string;
    };

    expect(createBody.name).toBe('House Burger');

    const listRes = await api
      .get(`/restaurants/${seeded.restaurantId}/menu/items`)
      .set(bearerHeader(ownerCtx.accessToken))
      .expect(200);

    expect(
      (listRes.body as Array<{ id: string }>).some(
        (entry) => entry.id === createBody.id,
      ),
    ).toBe(true);
  });

  it('PATCH /restaurants/:restaurantId/menu/items/reorder updates item sort order and DELETE /items/:itemId soft-deletes item', async () => {
    const ownerCtx = await registerAndLogin();
    const seeded = await seedRestaurantWithOwner(ownerCtx.userId);
    seededRestaurants.push(seeded);

    const categoryId = await insertCategory(
      client,
      seeded.restaurantId,
      'Pizzas',
    );
    const firstId = await insertItem(
      client,
      seeded.restaurantId,
      categoryId,
      'Margherita',
    );
    const secondId = await insertItem(
      client,
      seeded.restaurantId,
      categoryId,
      'Pepperoni',
    );

    await api
      .patch(`/restaurants/${seeded.restaurantId}/menu/items/reorder`)
      .set(bearerHeader(ownerCtx.accessToken))
      .send({
        ordered_ids: [secondId, firstId],
        category_id: categoryId,
      })
      .expect(200);

    const reordered = await client.query(
      'SELECT id, sort_order FROM menu_items WHERE id = ANY($1::uuid[]) ORDER BY sort_order ASC',
      [[secondId, firstId]],
    );

    expect(reordered.rows[0].id).toBe(secondId);
    expect(reordered.rows[0].sort_order).toBe(0);

    await api
      .delete(`/restaurants/${seeded.restaurantId}/menu/items/${firstId}`)
      .set(bearerHeader(ownerCtx.accessToken))
      .expect(200);

    const deletedItem = await client.query(
      'SELECT deleted_at, is_available FROM menu_items WHERE id = $1',
      [firstId],
    );

    expect(deletedItem.rows[0].deleted_at).not.toBeNull();
    expect(deletedItem.rows[0].is_available).toBe(false);
  });
});
