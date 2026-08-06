import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RECOMMENDATION_FEATURE_VERSION } from '@/modules/recommendation/domain/constants/recommendation-version.constants';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import { FeatureStore } from '@/modules/recommendation/domain/interfaces/feature-store.interface';
import {
  TrainingDataset,
  TrainingDatasetRow,
} from '@/modules/recommendation/domain/interfaces/training-dataset.interface';
import { RecommendationInteractionModel } from '../../infra/database/recommendation-interaction.model';
import { RecommendationModel } from '../../infra/database/recommendation.model';
import { RecommendationSessionModel } from '../../infra/database/recommendation-session.model';
import { RestaurantsModel } from '../../infra/database/restaurant.model';

interface GenerateFirstPartyDatasetInput {
  datasetVersion?: string;
  since?: Date;
}

@Injectable()
export class TrainingDatasetService {
  constructor(
    private readonly featureStore: FeatureStore,
    @InjectModel(RecommendationInteractionModel)
    private readonly interactionModel: typeof RecommendationInteractionModel,
  ) {}

  async generateFirstPartyDataset(
    input: GenerateFirstPartyDatasetInput = {},
  ): Promise<TrainingDataset> {
    const interactions = await this.interactionModel.findAll({
      where: {
        interaction_type: {
          [Op.in]: [
            RecommendationInteractionType.Like,
            RecommendationInteractionType.Dislike,
            RecommendationInteractionType.Rating,
          ],
        },
        ...(input.since ? { created_at: { [Op.gte]: input.since } } : {}),
      },
      include: [
        {
          model: RecommendationModel,
          required: true,
          include: [
            { model: RecommendationSessionModel, required: true },
            { model: RestaurantsModel, required: true },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });
    const rows: TrainingDatasetRow[] = [];

    for (const interaction of interactions) {
      const label = this.toLabel(interaction);
      const recommendation = interaction.recommendation;
      const session = recommendation?.session;
      const restaurant = recommendation?.restaurant;

      if (label === null || !session || !restaurant) continue;

      const context = {
        latitude: Number(session.latitude),
        longitude: Number(session.longitude),
        radiusMeters: session.radius_meters,
        requestedAt: session.generated_at,
      };
      const userFeatures = await this.featureStore.buildUserFeatures(
        session.user_id,
      );
      const contextFeatures = this.featureStore.buildContextFeatures(context);
      const restaurantFeatures = this.featureStore.buildRestaurantFeatures(
        restaurant,
        context,
        userFeatures,
      );

      rows.push({
        userFeatures,
        restaurantFeatures,
        contextFeatures,
        label,
      });
    }

    return {
      datasetVersion:
        input.datasetVersion ?? this.buildDatasetVersion(new Date()),
      featureVersion: RECOMMENDATION_FEATURE_VERSION,
      source: 'FIRST_PARTY',
      createdAt: new Date(),
      rows,
    };
  }

  private toLabel(interaction: RecommendationInteractionModel): 0 | 1 | null {
    if (
      interaction.interaction_type ===
      (RecommendationInteractionType.Like as unknown as string)
    ) {
      return 1;
    }

    if (
      interaction.interaction_type ===
      (RecommendationInteractionType.Dislike as unknown as string)
    ) {
      return 0;
    }

    if (
      interaction.interaction_type !==
      (RecommendationInteractionType.Rating as unknown as string)
    ) {
      return null;
    }

    const rating = Number(
      (interaction.value as { rating?: number } | null)?.rating,
    );

    if (rating >= 4) return 1;
    if (rating <= 2) return 0;
    return null;
  }

  private buildDatasetVersion(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `restaurant_recs_dataset_${year}_${month}_${day}_v1`;
  }
}
