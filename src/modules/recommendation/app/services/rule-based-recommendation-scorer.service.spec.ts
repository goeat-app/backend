import { RuleBasedRecommendationScorer } from './rule-based-recommendation-scorer.service';

const baseInput = {
  userFeatures: {
    userId: 'user-1',
    favoriteCuisines: [],
    preferredAmbiance: [],
    budgetLevel: null,
    cuisineAffinities: {},
    ambianceAffinities: {},
    budgetAffinity: {},
  },
  contextFeatures: {
    latitude: 0,
    longitude: 0,
    radiusMeters: 5000,
    requestedAt: new Date('2026-06-15T12:00:00.000Z'),
    dayOfWeek: 1,
    hourOfDay: 12,
  },
};

describe('RuleBasedRecommendationScorer', () => {
  it('scores and sorts restaurants with the default weighted formula', async () => {
    const scorer = new RuleBasedRecommendationScorer({
      get: jest.fn().mockReturnValue(undefined),
    } as never);

    const result = await scorer.score({
      ...baseInput,
      restaurantFeatures: [
        {
          restaurantId: 'low',
          cuisineMatch: 0,
          budgetMatch: 0,
          ambianceMatch: 0,
          normalizedRating: 0.5,
          normalizedDistance: 0.5,
          popularityScore: 0,
          distanceMeters: 1000,
        },
        {
          restaurantId: 'high',
          cuisineMatch: 1,
          budgetMatch: 1,
          ambianceMatch: 0.5,
          normalizedRating: 0.8,
          normalizedDistance: 0.9,
          popularityScore: 0,
          distanceMeters: 500,
        },
      ],
    });

    expect(result[0]).toMatchObject({
      restaurantId: 'high',
      score: 0.87,
      scoreBreakdown: {
        cuisineMatch: 0.35,
        budgetMatch: 0.25,
        ambianceMatch: 0.1,
        rating: 0.08000000000000002,
        distance: 0.09000000000000001,
      },
    });
    expect(result[1].restaurantId).toBe('low');
  });

  it('uses configured weights when valid JSON is provided', async () => {
    const scorer = new RuleBasedRecommendationScorer({
      get: jest.fn().mockReturnValue(
        JSON.stringify({
          cuisineMatch: 1,
          budgetMatch: 0,
          ambianceMatch: 0,
          rating: 0,
          distance: 0,
        }),
      ),
    } as never);

    const [result] = await scorer.score({
      ...baseInput,
      restaurantFeatures: [
        {
          restaurantId: 'restaurant-1',
          cuisineMatch: 0.42,
          budgetMatch: 1,
          ambianceMatch: 1,
          normalizedRating: 1,
          normalizedDistance: 1,
          popularityScore: 1,
          distanceMeters: 0,
        },
      ],
    });

    expect(result.score).toBe(0.42);
  });
});
