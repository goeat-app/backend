import { UserPreferenceEntity } from '../../domain/entities/user-preference.entity';
import { DefaultFeatureStore } from './default-feature-store.service';
import { RestaurantsModel } from '../../infra/database/restaurant.model';

describe('DefaultFeatureStore', () => {
  it('combines explicit preferences and learned profile affinities', async () => {
    const service = new DefaultFeatureStore(
      {
        findUserPreferencesByUserId: jest
          .fn()
          .mockResolvedValue(
            new UserPreferenceEntity(
              'user-1',
              null,
              null,
              [],
              [],
              null,
              null,
              ['Japanese Food'],
              ['Casual'],
              2,
            ),
          ),
      } as never,
      {
        findOne: jest.fn().mockResolvedValue({
          cuisine_affinities: { japanese_restaurant: 0.4 },
          ambiance_affinities: { casual: 0.2 },
          budget_affinity: { '3': -0.4 },
        }),
      } as never,
    );

    const userFeatures = await service.buildUserFeatures('user-1');
    const restaurantFeatures = service.buildRestaurantFeatures(
      {
        id: 'restaurant-1',
        latitude: -22.9,
        longitude: -47.06,
        primary_type: 'japanese_restaurant',
        types: ['restaurant', 'casual'],
        price_level: 3,
        google_rating: 4.5,
        google_rating_count: 999,
      } as RestaurantsModel,
      {
        latitude: -22.9,
        longitude: -47.06,
        radiusMeters: 5000,
        requestedAt: new Date('2026-06-15T18:00:00.000Z'),
      },
      userFeatures,
    );

    expect(userFeatures).toEqual({
      userId: 'user-1',
      favoriteCuisines: ['japanese_food'],
      preferredAmbiance: ['casual'],
      budgetLevel: 2,
      cuisineAffinities: { japanese_restaurant: 0.4 },
      ambianceAffinities: { casual: 0.2 },
      budgetAffinity: { '3': -0.4 },
    });
    expect(restaurantFeatures.cuisineMatch).toBe(0.1);
    expect(restaurantFeatures.ambianceMatch).toBe(1);
    expect(restaurantFeatures.budgetMatch).toBe(0.65);
    expect(restaurantFeatures.normalizedRating).toBe(0.9);
    expect(restaurantFeatures.normalizedDistance).toBe(1);
  });

  it('returns empty cold-start user features when preferences are missing', async () => {
    const service = new DefaultFeatureStore(
      {
        findUserPreferencesByUserId: jest.fn().mockResolvedValue(null),
      } as never,
      {
        findOne: jest.fn().mockResolvedValue(null),
      } as never,
    );

    await expect(service.buildUserFeatures('user-1')).resolves.toEqual({
      userId: 'user-1',
      favoriteCuisines: [],
      preferredAmbiance: [],
      budgetLevel: null,
      cuisineAffinities: {},
      ambianceAffinities: {},
      budgetAffinity: {},
    });
  });
});
