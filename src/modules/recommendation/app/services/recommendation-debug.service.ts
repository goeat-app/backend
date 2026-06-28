import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecommendationModel } from '../../infra/database/recommendation.model';
import { RecommendationSessionModel } from '../../infra/database/recommendation-session.model';
import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { IUserPreferenceRepository } from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';

@Injectable()
export class RecommendationDebugService {
  constructor(
    @InjectModel(RecommendationSessionModel)
    private readonly sessionModel: typeof RecommendationSessionModel,
    private readonly userPreferenceRepository: IUserPreferenceRepository,
  ) {}

  async getSessionDebug(sessionId: string): Promise<Record<string, unknown>> {
    const session = await this.sessionModel.findByPk(sessionId, {
      include: [
        {
          model: RecommendationModel,
          include: [{ model: RestaurantsModel }],
        },
      ],
    });

    if (!session) {
      throw new NotFoundException('Recommendation session not found');
    }

    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(
        session.user_id,
      );
    const recommendations = [...(session.recommendations ?? [])].sort(
      (left, right) => left.position - right.position,
    );

    return {
      sessionId: session.id,
      userId: session.user_id,
      generatedAt: session.generated_at,
      strategy: session.strategy,
      modelVersion: session.model_version,
      featureVersion: session.feature_version,
      candidateCount: session.candidate_count,
      radiusMeters: session.radius_meters,
      fallbackReason: session.fallback_reason,
      configSnapshot: session.config_snapshot,
      userPreferences: preferences
        ? {
            favoriteCuisines: preferences.favoriteCuisines,
            preferredAmbiance: preferences.preferredAmbiance,
            budgetLevel: preferences.budgetLevel,
          }
        : null,
      finalRanking: recommendations.map((recommendation) => ({
        recommendationId: recommendation.id,
        restaurantId: recommendation.restaurant_id,
        restaurantName: recommendation.restaurant?.name,
        position: recommendation.position,
        score: Number(recommendation.score),
        isPrimary: recommendation.is_primary,
        scoreBreakdown: recommendation.score_breakdown,
      })),
    };
  }
}
