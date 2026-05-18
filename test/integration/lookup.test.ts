import { api } from '../helpers/http';

describe('Lookup endpoints', () => {
  describe('GET /food/categories', () => {
    it('returns a non-empty array of food categories', async () => {
      const res = await api.get('/food/categories').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length).toBeGreaterThan(0);
    });

    it('each category has id, name, and slug fields', async () => {
      const res = await api.get('/food/categories').expect(200);

      const categories = res.body as Array<{
        id: string;
        name: string;
        slug: string;
      }>;

      for (const category of categories) {
        expect(typeof category.id).toBe('string');
        expect(category.id.length).toBeGreaterThan(0);
        expect(typeof category.name).toBe('string');
        expect(category.name.length).toBeGreaterThan(0);
        expect(typeof category.slug).toBe('string');
        expect(category.slug.length).toBeGreaterThan(0);
      }
    });
  });

  describe('GET /places/types', () => {
    it('returns a non-empty array of place types', async () => {
      const res = await api.get('/places/types').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length).toBeGreaterThan(0);
    });

    it('each place type has id, name, and slug fields', async () => {
      const res = await api.get('/places/types').expect(200);

      const types = res.body as Array<{
        id: string;
        name: string;
        slug: string;
      }>;

      for (const type of types) {
        expect(typeof type.id).toBe('string');
        expect(type.id.length).toBeGreaterThan(0);
        expect(typeof type.name).toBe('string');
        expect(type.name.length).toBeGreaterThan(0);
        expect(typeof type.slug).toBe('string');
        expect(type.slug.length).toBeGreaterThan(0);
      }
    });
  });
});
