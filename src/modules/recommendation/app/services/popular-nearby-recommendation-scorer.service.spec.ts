import { PopularNearbyRecommendationScorer } from './popular-nearby-recommendation-scorer.service';

describe('PopularNearbyRecommendationScorer', () => {
  it('scores by rating, popularity, and distance', async () => {
    const scorer = new PopularNearbyRecommendationScorer();

    const result = await scorer.score({
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
        requestedAt: new Date(),
        dayOfWeek: 1,
        hourOfDay: 12,
      },
      restaurantFeatures: [
        {
          restaurantId: 'lower',
          cuisineMatch: 0,
          budgetMatch: 0,
          ambianceMatch: 0,
          normalizedRating: 0.4,
          normalizedDistance: 0.4,
          popularityScore: 0.4,
          distanceMeters: 1000,
        },
        {
          restaurantId: 'higher',
          cuisineMatch: 0,
          budgetMatch: 0,
          ambianceMatch: 0,
          normalizedRating: 0.8,
          normalizedDistance: 0.8,
          popularityScore: 0.8,
          distanceMeters: 1000,
        },
      ],
    });

    expect(result[0].restaurantId).toBe('higher');
    expect(result[0].scoreBreakdown).toEqual({
      rating: 0.36000000000000004,
      popularity: 0.2,
      distance: 0.16000000000000003,
    });
  });
});
