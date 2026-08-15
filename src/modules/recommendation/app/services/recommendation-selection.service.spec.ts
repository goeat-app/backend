import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { RecommendationSelectionService } from './recommendation-selection.service';

const feature = (restaurantId: string, distanceMeters: number) => ({
  restaurantId,
  cuisineMatch: 1,
  budgetMatch: 1,
  ambianceMatch: 1,
  normalizedRating: 1,
  normalizedDistance: 1,
  popularityScore: 1,
  distanceMeters,
});

describe('RecommendationSelectionService', () => {
  it('selects configured hero and secondary counts with cuisine diversity', () => {
    const service = new RecommendationSelectionService({
      getBusinessRulesConfig: jest.fn().mockReturnValue({
        heroCount: 1,
        secondaryCount: 4,
        recentlyShownSuppressionHours: 24,
        minimumCuisineDiversity: 2,
      }),
    } as never);
    const restaurants = [
      { id: 'r1', primary_type: 'sushi', google_rating_count: 50 },
      { id: 'r2', primary_type: 'sushi', google_rating_count: 40 },
      { id: 'r3', primary_type: 'sushi', google_rating_count: 30 },
      { id: 'r4', primary_type: 'sushi', google_rating_count: 20 },
      { id: 'r5', primary_type: 'italian', google_rating_count: 10 },
      { id: 'r6', primary_type: 'burger', google_rating_count: 10 },
    ] as RestaurantsModel[];

    const result = service.select(
      restaurants.map((restaurant, index) => ({
        restaurantId: restaurant.id,
        score: 1 - index * 0.01,
      })),
      restaurants,
      restaurants.map((restaurant, index) =>
        feature(restaurant.id, index * 100),
      ),
    );

    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      restaurant: { id: 'r1' },
      isPrimary: true,
    });
    expect(result.slice(1).every((item) => !item.isPrimary)).toBe(true);
    expect(result.map((item) => item.restaurant.id)).toContain('r5');
  });

  it('uses rating count and distance as tie breakers', () => {
    const service = new RecommendationSelectionService({
      getBusinessRulesConfig: jest.fn().mockReturnValue({
        heroCount: 1,
        secondaryCount: 1,
        recentlyShownSuppressionHours: 24,
        minimumCuisineDiversity: 1,
      }),
    } as never);
    const restaurants = [
      { id: 'far-popular', primary_type: 'sushi', google_rating_count: 100 },
      {
        id: 'near-less-popular',
        primary_type: 'sushi',
        google_rating_count: 10,
      },
    ] as RestaurantsModel[];

    const result = service.select(
      restaurants.map((restaurant) => ({
        restaurantId: restaurant.id,
        score: 0.8,
      })),
      restaurants,
      [feature('far-popular', 1000), feature('near-less-popular', 100)],
    );

    expect(result[0].restaurant.id).toBe('far-popular');
  });
});
