import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import {
  IRecommendationFeedbackRepository,
  RecordRecommendationFeedbackInput,
  RecommendationFeedbackTarget,
} from '@/modules/recommendation/domain/interfaces/repositories/recommendation-feedback-repository.interface';
import { RecommendationFeedbackStateModel } from '../../database/recommendation-feedback-state.model';
import { RecommendationInteractionModel } from '../../database/recommendation-interaction.model';
import { RecommendationModel } from '../../database/recommendation.model';
import { RecommendationSessionModel } from '../../database/recommendation-session.model';
import { RestaurantRatingModel } from '../../database/restaurant-rating.model';
import { RestaurantsModel } from '../../database/restaurant.model';

@Injectable()
export class RecommendationFeedbackRepository implements IRecommendationFeedbackRepository {
  constructor(
    @InjectModel(RecommendationModel)
    private readonly recommendationModel: typeof RecommendationModel,
    @InjectModel(RecommendationInteractionModel)
    private readonly interactionModel: typeof RecommendationInteractionModel,
    @InjectModel(RecommendationFeedbackStateModel)
    private readonly feedbackStateModel: typeof RecommendationFeedbackStateModel,
    @InjectModel(RestaurantRatingModel)
    private readonly restaurantRatingModel: typeof RestaurantRatingModel,
  ) {}

  async findRecommendationForUser(
    recommendationId: string,
    userId: string,
  ): Promise<RecommendationFeedbackTarget | null> {
    const recommendation = await this.recommendationModel.findOne({
      where: { id: recommendationId },
      include: [
        {
          model: RecommendationSessionModel,
          where: { user_id: userId },
        },
        {
          model: RestaurantsModel,
        },
      ],
    });

    if (!recommendation?.restaurant) return null;

    return {
      recommendationId: recommendation.id,
      restaurantId: recommendation.restaurant_id,
      restaurant: recommendation.restaurant,
    };
  }

  async createInteraction(
    input: RecordRecommendationFeedbackInput,
  ): Promise<void> {
    await this.interactionModel.create({
      recommendation_id: input.recommendationId,
      user_id: input.userId,
      interaction_type: input.type,
      value:
        input.type === RecommendationInteractionType.Rating
          ? { rating: input.rating }
          : null,
      created_at: new Date(),
    });
  }

  async upsertFeedbackState(
    input: RecordRecommendationFeedbackInput,
  ): Promise<void> {
    const now = new Date();
    const [record] = await this.feedbackStateModel.findOrCreate({
      where: {
        recommendation_id: input.recommendationId,
        user_id: input.userId,
      },
      defaults: {
        recommendation_id: input.recommendationId,
        user_id: input.userId,
        current_type: input.type,
        updated_at: now,
      },
    });

    await record.update({
      current_type: input.type,
      updated_at: now,
    });
  }

  async upsertRestaurantRating(input: {
    userId: string;
    restaurantId: string;
    rating: number;
  }): Promise<void> {
    const now = new Date();
    const [record] = await this.restaurantRatingModel.findOrCreate({
      where: {
        user_id: input.userId,
        restaurant_id: input.restaurantId,
      },
      defaults: {
        user_id: input.userId,
        restaurant_id: input.restaurantId,
        rating: input.rating,
        created_at: now,
        updated_at: now,
      },
    });

    await record.update({
      rating: input.rating,
      updated_at: now,
    });
  }
}
