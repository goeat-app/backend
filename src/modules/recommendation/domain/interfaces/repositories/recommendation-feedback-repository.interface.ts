import { RecommendationInteractionType } from '../../enums/recommendation-interaction-type.enum';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';

export interface RecommendationFeedbackTarget {
  recommendationId: string;
  restaurantId: string;
  restaurant: RestaurantsModel;
}

export interface RecordRecommendationFeedbackInput {
  recommendationId: string;
  userId: string;
  type: RecommendationInteractionType;
  rating?: number;
}

export abstract class IRecommendationFeedbackRepository {
  abstract findRecommendationForUser(
    recommendationId: string,
    userId: string,
  ): Promise<RecommendationFeedbackTarget | null>;

  abstract createInteraction(
    input: RecordRecommendationFeedbackInput,
  ): Promise<void>;

  abstract upsertFeedbackState(
    input: RecordRecommendationFeedbackInput,
  ): Promise<void>;

  abstract upsertRestaurantRating(input: {
    userId: string;
    restaurantId: string;
    rating: number;
  }): Promise<void>;
}
