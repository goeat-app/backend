import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import { PlacesProvider } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { RestaurantDetails } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RecommendationInteractionModel } from '../../infra/database/recommendation-interaction.model';
import { RecommendationModel } from '../../infra/database/recommendation.model';
import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { RecommendationMonitoringService } from './recommendation-monitoring.service';
import { UserProfileLearningService } from './user-profile-learning.service';

@Injectable()
export class RecommendationMaintenanceService {
  constructor(
    private readonly placesProvider: PlacesProvider,
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly userProfileLearningService: UserProfileLearningService,
    private readonly monitoringService: RecommendationMonitoringService,
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
    @InjectModel(RecommendationInteractionModel)
    private readonly interactionModel: typeof RecommendationInteractionModel,
  ) {}

  async refreshStaleRestaurants(
    limit = 50,
  ): Promise<{ processedCount: number }> {
    const startedAt = Date.now();

    try {
      const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const restaurants = await this.restaurantModel.findAll({
        where: {
          provider_place_id: { [Op.ne]: null },
          [Op.or]: [{ description: null }, { editorial_summary: null }],
        },
        limit,
      });
      const refreshed: RestaurantDetails[] = [];

      for (const restaurant of restaurants) {
        if (!restaurant.provider_place_id) continue;
        refreshed.push(
          await this.placesProvider.getPlaceDetails(
            restaurant.provider_place_id,
          ),
        );
      }

      if (refreshed.length) {
        await this.restaurantRepository.upsertDiscoveredRestaurants(refreshed);
      }

      this.monitoringService.logJobResult({
        job: 'restaurant_refresh',
        status: 'success',
        durationMs: Date.now() - startedAt,
        processedCount: refreshed.length,
      });

      return { processedCount: refreshed.length };
    } catch (error) {
      this.monitoringService.logJobResult({
        job: 'restaurant_refresh',
        status: 'failure',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown error',
      });
      throw error;
    }
  }

  async recomputeUserProfiles(): Promise<{ processedCount: number }> {
    const startedAt = Date.now();

    try {
      const interactions = await this.interactionModel.findAll({
        where: {
          interaction_type: {
            [Op.in]: [
              RecommendationInteractionType.Like,
              RecommendationInteractionType.Dislike,
              RecommendationInteractionType.Rating,
            ],
          },
        },
        include: [
          {
            model: RecommendationModel,
            required: true,
            include: [{ model: RestaurantsModel, required: true }],
          },
        ],
        order: [['created_at', 'ASC']],
      });
      const userIds = [...new Set(interactions.map((item) => item.user_id))];

      for (const userId of userIds) {
        await this.userProfileLearningService.resetProfile(userId);
      }

      for (const interaction of interactions) {
        const recommendation = interaction.recommendation;
        if (!recommendation?.restaurant) continue;

        await this.userProfileLearningService.applyFeedback({
          userId: interaction.user_id,
          restaurant: recommendation.restaurant,
          type: interaction.interaction_type as RecommendationInteractionType,
          rating: Number(
            (interaction.value as { rating?: number } | null)?.rating,
          ),
        });
      }

      this.monitoringService.logJobResult({
        job: 'user_profile_recompute',
        status: 'success',
        durationMs: Date.now() - startedAt,
        processedCount: userIds.length,
      });

      return { processedCount: userIds.length };
    } catch (error) {
      this.monitoringService.logJobResult({
        job: 'user_profile_recompute',
        status: 'failure',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown error',
      });
      throw error;
    }
  }
}
