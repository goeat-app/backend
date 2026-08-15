import { Injectable } from '@nestjs/common';
import {
  RecommendationScorer,
  RecommendationScoringInput,
} from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import type { ScoredRestaurant } from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import { clamp } from '../utils/distance';

@Injectable()
export class PopularNearbyRecommendationScorer extends RecommendationScorer {
  // eslint-disable-next-line @typescript-eslint/require-await
  async score(input: RecommendationScoringInput): Promise<ScoredRestaurant[]> {
    return input.restaurantFeatures
      .map((restaurant) => {
        const scoreBreakdown = {
          rating: 0.45 * restaurant.normalizedRating,
          popularity: 0.25 * restaurant.popularityScore,
          distance: 0.2 * restaurant.normalizedDistance,
        };

        return {
          restaurantId: restaurant.restaurantId,
          score: clamp(
            Object.values(scoreBreakdown).reduce(
              (sum, value) => sum + value,
              0,
            ),
          ),
          scoreBreakdown,
        };
      })
      .sort((left, right) => right.score - left.score);
  }
}
