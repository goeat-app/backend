import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import {
  CreateRecommendationSessionInput,
  IRecommendationSessionRepository,
  RecommendationHistoryItem,
  PersistedRecommendationSession,
} from '@/modules/recommendation/domain/interfaces/repositories/recommendation-session-repository.interface';
import { RecommendationInteractionModel } from '../../database/recommendation-interaction.model';
import { RecommendationModel } from '../../database/recommendation.model';
import { RecommendationSessionModel } from '../../database/recommendation-session.model';
import { RestaurantsModel } from '../../database/restaurant.model';

@Injectable()
export class RecommendationSessionRepository implements IRecommendationSessionRepository {
  constructor(
    @InjectModel(RecommendationSessionModel)
    private readonly sessionModel: typeof RecommendationSessionModel,
    @InjectModel(RecommendationModel)
    private readonly recommendationModel: typeof RecommendationModel,
  ) {}

  async createWithRecommendations(
    input: CreateRecommendationSessionInput,
  ): Promise<PersistedRecommendationSession> {
    const generatedAt = new Date();
    const session = await this.sessionModel.create({
      user_id: input.userId,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_meters: input.radiusMeters,
      strategy: input.strategy,
      model_version: input.modelVersion,
      feature_version: input.featureVersion,
      candidate_count: input.candidateCount,
      config_snapshot: input.configSnapshot ?? null,
      fallback_reason: input.fallbackReason ?? null,
      generated_at: generatedAt,
    });
    const created = await this.recommendationModel.bulkCreate(
      input.recommendations.map((recommendation) => ({
        session_id: session.id,
        restaurant_id: recommendation.restaurantId,
        position: recommendation.position,
        score: recommendation.score,
        is_primary: recommendation.isPrimary,
        score_breakdown: recommendation.scoreBreakdown ?? null,
        created_at: generatedAt,
      })),
      { returning: true },
    );

    return {
      sessionId: session.id,
      strategy: input.strategy,
      featureVersion: input.featureVersion,
      generatedAt,
      recommendations: created.map((recommendation) => ({
        recommendationId: recommendation.id,
        restaurantId: recommendation.restaurant_id,
        score: Number(recommendation.score),
        position: recommendation.position,
        isPrimary: recommendation.is_primary,
        scoreBreakdown: recommendation.score_breakdown ?? undefined,
      })),
    };
  }

  async listHistory(
    userId: string,
    limit = 10,
  ): Promise<RecommendationHistoryItem[]> {
    const sessions = await this.sessionModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: RecommendationModel,
          include: [{ model: RestaurantsModel }],
        },
      ],
      order: [
        ['generated_at', 'DESC'],
        [RecommendationModel, 'position', 'ASC'],
      ],
      limit,
    });

    return sessions.map((session) => {
      const recommendations = [...(session.recommendations ?? [])].sort(
        (left, right) => left.position - right.position,
      );
      const hero = recommendations.find((recommendation) =>
        Boolean(recommendation.is_primary),
      );

      return {
        sessionId: session.id,
        generatedAt: session.generated_at,
        hero: hero
          ? {
              restaurantId: hero.restaurant_id,
              name: hero.restaurant?.name ?? '',
            }
          : null,
        secondary: recommendations
          .filter((recommendation) => !recommendation.is_primary)
          .map((recommendation) => ({
            restaurantId: recommendation.restaurant_id,
            name: recommendation.restaurant?.name ?? '',
          })),
      };
    });
  }

  async findRecentlyShownRestaurantIds(
    userId: string,
    since: Date,
  ): Promise<string[]> {
    const recommendations = await this.recommendationModel.findAll({
      include: [
        {
          model: RecommendationSessionModel,
          where: {
            user_id: userId,
            generated_at: { [Op.gte]: since },
          },
          attributes: [],
        },
      ],
      attributes: ['restaurant_id'],
    });

    return [...new Set(recommendations.map((item) => item.restaurant_id))];
  }

  async findRecentlyDislikedRestaurantIds(
    userId: string,
    since: Date,
  ): Promise<string[]> {
    const recommendations = await this.recommendationModel.findAll({
      include: [
        {
          model: RecommendationInteractionModel,
          where: {
            user_id: userId,
            interaction_type: RecommendationInteractionType.Dislike,
            created_at: { [Op.gte]: since },
          },
          attributes: [],
        },
      ],
      attributes: ['restaurant_id'],
    });

    return [...new Set(recommendations.map((item) => item.restaurant_id))];
  }
}
