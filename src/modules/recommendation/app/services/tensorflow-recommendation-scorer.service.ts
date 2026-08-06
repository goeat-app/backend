import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  RecommendationScorer,
  RecommendationScoringInput,
  ScoredRestaurant,
} from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import {
  RECOMMENDATION_FEATURE_VERSION,
  RECOMMENDATION_FEATURE_VERSION_V2,
} from '@/modules/recommendation/domain/constants/recommendation-version.constants';
import { RuleBasedRecommendationScorer } from './rule-based-recommendation-scorer.service';

interface PredictionResponse {
  modelVersion: string;
  featureVersion: string;
  scores: Array<{
    restaurantId: string;
    score: number;
  }>;
}

export const PREDICTION_SERVICE_FALLBACK_REASON =
  'PREDICTION_SERVICE_UNAVAILABLE';

@Injectable()
export class TensorFlowRecommendationScorer extends RecommendationScorer {
  private readonly logger = new Logger(TensorFlowRecommendationScorer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fallbackScorer: RuleBasedRecommendationScorer,
  ) {
    super();
  }

  async score(input: RecommendationScoringInput): Promise<ScoredRestaurant[]> {
    const predictionServiceUrl = this.configService.get<string>(
      'PREDICTION_SERVICE_URL',
    );
    const modelVersion =
      this.configService.get<string>('RECOMMENDATION_MODEL_VERSION') ??
      'restaurant_ranker_v1';

    const featureVersion =
      modelVersion === 'restaurant_ranker_v2'
        ? RECOMMENDATION_FEATURE_VERSION_V2
        : RECOMMENDATION_FEATURE_VERSION;

    if (!predictionServiceUrl) {
      return this.scoreWithFallback(input);
    }

    try {
      const response = await axios.post<PredictionResponse>(
        `${predictionServiceUrl.replace(/\/$/, '')}/predict`,
        {
          modelVersion,
          featureVersion,
          userFeatures: input.userFeatures,
          contextFeatures: input.contextFeatures,
          restaurantFeatures: input.restaurantFeatures.map((features) => ({
            restaurantId: features.restaurantId,
            features,
          })),
        },
        {
          headers: this.buildHeaders(),
          timeout: 3000,
        },
      );
      this.validateResponse(response.data, input, modelVersion);

      return response.data.scores
        .map((score) => ({
          restaurantId: score.restaurantId,
          score: Math.max(0, Math.min(1, Number(score.score))),
          scoreBreakdown: {
            tensorflow: Math.max(0, Math.min(1, Number(score.score))),
          },
        }))
        .sort((left, right) => right.score - left.score);
    } catch (error) {
      this.logger.warn(
        `Prediction service failed for ${modelVersion}; falling back to rules: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return this.scoreWithFallback(input);
    }
  }

  private buildHeaders(): Record<string, string> {
    const token = this.configService.get<string>('PREDICTION_SERVICE_TOKEN');

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private validateResponse(
    response: PredictionResponse,
    input: RecommendationScoringInput,
    expectedModelVersion: string,
  ): void {
    if (response.modelVersion !== expectedModelVersion) {
      throw new Error('Prediction model version mismatch');
    }

    if (response.featureVersion !== RECOMMENDATION_FEATURE_VERSION &&
        response.featureVersion !== RECOMMENDATION_FEATURE_VERSION_V2) {
      throw new Error('Prediction feature version mismatch');
    }

    if (!Array.isArray(response.scores)) {
      throw new Error('Prediction response scores are missing');
    }

    const expectedIds = new Set(
      input.restaurantFeatures.map((features) => features.restaurantId),
    );

    if (response.scores.length !== expectedIds.size) {
      throw new Error('Prediction score count mismatch');
    }

    for (const score of response.scores) {
      if (
        !expectedIds.has(score.restaurantId) ||
        !Number.isFinite(Number(score.score))
      ) {
        throw new Error('Prediction response contains invalid score');
      }
    }
  }

  private async scoreWithFallback(
    input: RecommendationScoringInput,
  ): Promise<ScoredRestaurant[]> {
    const fallbackScores = await this.fallbackScorer.score(input);

    return fallbackScores.map((score) => ({
      ...score,
      fallbackReason: PREDICTION_SERVICE_FALLBACK_REASON,
    }));
  }
}
