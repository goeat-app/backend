import {
  ContextFeatureVector,
  RestaurantFeatureVector,
  UserFeatureVector,
} from './feature-store.interface';

export interface RecommendationScoringInput {
  userFeatures: UserFeatureVector;
  restaurantFeatures: RestaurantFeatureVector[];
  contextFeatures: ContextFeatureVector;
}

export interface ScoredRestaurant {
  restaurantId: string;
  score: number;
  scoreBreakdown?: Record<string, number>;
  fallbackReason?: string;
}

export abstract class RecommendationScorer {
  abstract score(
    input: RecommendationScoringInput,
  ): Promise<ScoredRestaurant[]>;
}
