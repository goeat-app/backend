import { RecommendationStrategy } from '../../domain/enums/recommendation-strategy.enum';
import { GenerateRecommendationsUseCase } from './generate-recommendations.use-case';

const restaurant = {
  id: 'restaurant-1',
  name: 'Sushi House',
  latitude: -22.9,
  longitude: -47.06,
  google_rating: 4.5,
  google_rating_count: 100,
  price_level: 2,
};
const userFeatures = {
  userId: 'user-1',
  favoriteCuisines: [],
  preferredAmbiance: [],
  budgetLevel: null,
  cuisineAffinities: {},
  ambianceAffinities: {},
  budgetAffinity: {},
};
const contextFeatures = {
  latitude: -22.9,
  longitude: -47.06,
  radiusMeters: 5000,
  requestedAt: new Date('2026-06-15T18:00:00.000Z'),
  dayOfWeek: 1,
  hourOfDay: 18,
};
const restaurantFeature = {
  restaurantId: 'restaurant-1',
  cuisineMatch: 1,
  budgetMatch: 1,
  ambianceMatch: 1,
  normalizedRating: 0.9,
  normalizedDistance: 1,
  popularityScore: 0.5,
  distanceMeters: 100,
};

function buildUseCase(scored: Array<Record<string, unknown>>) {
  const sessionRepository = {
    createWithRecommendations: jest.fn().mockResolvedValue({
      sessionId: 'session-1',
      recommendations: [
        {
          recommendationId: 'recommendation-1',
          restaurantId: 'restaurant-1',
        },
      ],
    }),
  };
  const useCase = new GenerateRecommendationsUseCase(
    {
      generate: jest.fn().mockResolvedValue({
        candidates: [restaurant],
        radiusMeters: 5000,
        googlePlacesLatencyMs: 12,
      }),
    } as never,
    {
      buildUserFeatures: jest.fn().mockResolvedValue(userFeatures),
      buildContextFeatures: jest.fn().mockReturnValue(contextFeatures),
      buildRestaurantFeatures: jest.fn().mockReturnValue(restaurantFeature),
    } as never,
    {
      score: jest.fn().mockResolvedValue(scored),
    } as never,
    {
      select: jest.fn().mockReturnValue([
        {
          restaurant,
          feature: restaurantFeature,
          score: Number(scored[0].score),
          scoreBreakdown: scored[0].scoreBreakdown,
          isPrimary: true,
        },
      ]),
    } as never,
    sessionRepository as never,
    {
      get: jest.fn((key: string) =>
        key === 'RECOMMENDATION_SCORER'
          ? 'tensorflow'
          : key === 'RECOMMENDATION_MODEL_VERSION'
            ? 'model-v1'
            : undefined,
      ),
    } as never,
    { logRecommendationRequest: jest.fn() } as never,
    {
      getConfig: jest.fn().mockReturnValue({ scorer: 'tensorflow' }),
    } as never,
    { score: jest.fn() } as never,
  );

  return { useCase, sessionRepository };
}

describe('GenerateRecommendationsUseCase ML metadata', () => {
  it('stores TensorFlow strategy when ML scoring succeeds', async () => {
    const { useCase, sessionRepository } = buildUseCase([
      {
        restaurantId: 'restaurant-1',
        score: 0.91,
        scoreBreakdown: { tensorflow: 0.91 },
      },
    ]);

    await useCase.execute('user-1', {
      latitude: -22.9,
      longitude: -47.06,
      radiusMeters: 5000,
    });

    expect(sessionRepository.createWithRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: RecommendationStrategy.TensorFlowV1,
        modelVersion: 'model-v1',
        fallbackReason: undefined,
      }),
    );
  });

  it('stores rule-based strategy and fallback reason when prediction falls back', async () => {
    const { useCase, sessionRepository } = buildUseCase([
      {
        restaurantId: 'restaurant-1',
        score: 0.75,
        scoreBreakdown: { cuisineMatch: 0.35 },
        fallbackReason: 'PREDICTION_SERVICE_UNAVAILABLE',
      },
    ]);

    await useCase.execute('user-1', {
      latitude: -22.9,
      longitude: -47.06,
      radiusMeters: 5000,
    });

    expect(sessionRepository.createWithRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({
        strategy: RecommendationStrategy.RuleBasedV1,
        modelVersion: 'none',
        fallbackReason: 'PREDICTION_SERVICE_UNAVAILABLE',
      }),
    );
  });
});
