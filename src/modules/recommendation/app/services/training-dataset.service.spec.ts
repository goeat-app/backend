import { RecommendationInteractionType } from '../../domain/enums/recommendation-interaction-type.enum';
import { TrainingDatasetService } from './training-dataset.service';

const session = {
  user_id: 'user-1',
  latitude: -22.9,
  longitude: -47.06,
  radius_meters: 5000,
  generated_at: new Date('2026-06-15T18:00:00.000Z'),
};
const restaurant = {
  id: 'restaurant-1',
};

describe('TrainingDatasetService', () => {
  it('builds first-party rows for positive and negative labels', async () => {
    const featureStore = {
      buildUserFeatures: jest.fn().mockResolvedValue({
        userId: 'user-1',
        favoriteCuisines: ['japanese'],
        preferredAmbiance: ['casual'],
        budgetLevel: 2,
        cuisineAffinities: {},
        ambianceAffinities: {},
        budgetAffinity: {},
      }),
      buildContextFeatures: jest.fn().mockReturnValue({
        dayOfWeek: 1,
        hourOfDay: 18,
      }),
      buildRestaurantFeatures: jest.fn().mockReturnValue({
        restaurantId: 'restaurant-1',
        cuisineMatch: 1,
      }),
    };
    const service = new TrainingDatasetService(
      featureStore as never,
      {
        findAll: jest.fn().mockResolvedValue([
          {
            interaction_type: RecommendationInteractionType.Like,
            recommendation: { session, restaurant },
          },
          {
            interaction_type: RecommendationInteractionType.Dislike,
            recommendation: { session, restaurant },
          },
          {
            interaction_type: RecommendationInteractionType.Rating,
            value: { rating: 3 },
            recommendation: { session, restaurant },
          },
        ]),
      } as never,
    );

    const dataset = await service.generateFirstPartyDataset({
      datasetVersion: 'dataset_v1',
    });

    expect(dataset).toMatchObject({
      datasetVersion: 'dataset_v1',
      featureVersion: 'restaurant_recommendation_v1',
      source: 'FIRST_PARTY',
    });
    expect(dataset.rows).toEqual([
      {
        userFeatures: {
          userId: 'user-1',
          favoriteCuisines: ['japanese'],
          preferredAmbiance: ['casual'],
          budgetLevel: 2,
          cuisineAffinities: {},
          ambianceAffinities: {},
          budgetAffinity: {},
        },
        contextFeatures: {
          dayOfWeek: 1,
          hourOfDay: 18,
        },
        restaurantFeatures: {
          restaurantId: 'restaurant-1',
          cuisineMatch: 1,
        },
        label: 1,
      },
      {
        userFeatures: {
          userId: 'user-1',
          favoriteCuisines: ['japanese'],
          preferredAmbiance: ['casual'],
          budgetLevel: 2,
          cuisineAffinities: {},
          ambianceAffinities: {},
          budgetAffinity: {},
        },
        contextFeatures: {
          dayOfWeek: 1,
          hourOfDay: 18,
        },
        restaurantFeatures: {
          restaurantId: 'restaurant-1',
          cuisineMatch: 1,
        },
        label: 0,
      },
    ]);
    expect(featureStore.buildUserFeatures).toHaveBeenCalledTimes(2);
  });

  it('labels rating feedback using the MVP thresholds', async () => {
    const service = new TrainingDatasetService(
      {
        buildUserFeatures: jest.fn().mockResolvedValue({ userId: 'user-1' }),
        buildContextFeatures: jest.fn().mockReturnValue({}),
        buildRestaurantFeatures: jest.fn().mockReturnValue({}),
      } as never,
      {
        findAll: jest.fn().mockResolvedValue([
          {
            interaction_type: RecommendationInteractionType.Rating,
            value: { rating: 5 },
            recommendation: { session, restaurant },
          },
          {
            interaction_type: RecommendationInteractionType.Rating,
            value: { rating: 1 },
            recommendation: { session, restaurant },
          },
        ]),
      } as never,
    );

    const dataset = await service.generateFirstPartyDataset();

    expect(dataset.rows.map((row) => row.label)).toEqual([1, 0]);
  });
});
