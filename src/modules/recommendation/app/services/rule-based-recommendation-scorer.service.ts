import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RecommendationScorer,
  RecommendationScoringInput,
  ScoredRestaurant,
} from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import { clamp } from '../utils/distance';

interface RuleBasedWeights {
  cuisineMatch: number;
  budgetMatch: number;
  ambianceMatch: number;
  rating: number;
  distance: number;
}

const defaultWeights: RuleBasedWeights = {
  cuisineMatch: 0.35,
  budgetMatch: 0.25,
  ambianceMatch: 0.2,
  rating: 0.1,
  distance: 0.1,
};

@Injectable()
export class RuleBasedRecommendationScorer extends RecommendationScorer {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async score(input: RecommendationScoringInput): Promise<ScoredRestaurant[]> {
    const weights = this.getWeights();

    return input.restaurantFeatures
      .map((restaurant) => {
        const scoreBreakdown = {
          cuisineMatch: weights.cuisineMatch * restaurant.cuisineMatch,
          budgetMatch: weights.budgetMatch * restaurant.budgetMatch,
          ambianceMatch: weights.ambianceMatch * restaurant.ambianceMatch,
          rating: weights.rating * restaurant.normalizedRating,
          distance: weights.distance * restaurant.normalizedDistance,
        };
        const score = clamp(
          Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0),
        );

        return {
          restaurantId: restaurant.restaurantId,
          score,
          scoreBreakdown,
        };
      })
      .sort((left, right) => right.score - left.score);
  }

  private getWeights(): RuleBasedWeights {
    const configured = this.configService.get<string>(
      'RECOMMENDATION_RULE_WEIGHTS',
    );

    if (!configured) return defaultWeights;

    const configuredParsed = JSON.parse(
      configured,
    ) as Partial<RuleBasedWeights>;

    try {
      return { ...defaultWeights, ...configuredParsed };
    } catch {
      return defaultWeights;
    }
  }
}
