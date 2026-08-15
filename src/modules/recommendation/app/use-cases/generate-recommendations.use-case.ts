import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RECOMMENDATION_FEATURE_VERSION,
  RECOMMENDATION_MODEL_VERSION_NONE,
} from '@/modules/recommendation/domain/constants/recommendation-version.constants';
import { RecommendationStrategy } from '@/modules/recommendation/domain/enums/recommendation-strategy.enum';
import { RecommendationError } from '@/modules/recommendation/domain/errors/recommendation.error';
import { FeatureStore } from '@/modules/recommendation/domain/interfaces/feature-store.interface';
import {
  RecommendationScorer,
  ScoredRestaurant,
} from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import { IRecommendationSessionRepository } from '@/modules/recommendation/domain/interfaces/repositories/recommendation-session-repository.interface';
import { GenerateRecommendationsInput } from '../dtos/request/generate-recommendations.dto';
import { GenerateRecommendationsResponseDto } from '../dtos/response/generate-recommendations-response.dto';
import { CandidateGenerationService } from '../services/candidate-generation.service';
import { RecommendationSelectionService } from '../services/recommendation-selection.service';
import { RecommendationMonitoringService } from '../services/recommendation-monitoring.service';
import { RecommendationStrategyConfigService } from '../services/recommendation-strategy-config.service';
import { PopularNearbyRecommendationScorer } from '../services/popular-nearby-recommendation-scorer.service';
import { RestaurantFeatureVector } from '@/modules/recommendation/domain/interfaces/feature-store.interface';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { calculateDistanceMeters, clamp } from '../utils/distance';

@Injectable()
export class GenerateRecommendationsUseCase {
  constructor(
    private readonly candidateGenerationService: CandidateGenerationService,
    private readonly featureStore: FeatureStore,
    private readonly scorer: RecommendationScorer,
    private readonly selectionService: RecommendationSelectionService,
    private readonly sessionRepository: IRecommendationSessionRepository,
    private readonly configService: ConfigService,
    private readonly monitoringService: RecommendationMonitoringService,
    private readonly strategyConfigService: RecommendationStrategyConfigService,
    private readonly popularNearbyScorer: PopularNearbyRecommendationScorer,
  ) {}

  async execute(
    userId: string,
    input: GenerateRecommendationsInput,
  ): Promise<GenerateRecommendationsResponseDto> {
    const startedAt = Date.now();
    const candidateResult = await this.candidateGenerationService.generate({
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
    });

    if (!candidateResult.candidates.length) {
      throw new RecommendationError('No recommendation candidates found');
    }

    const context = {
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: candidateResult.radiusMeters,
      requestedAt: new Date(),
    };
    let fallbackReason = candidateResult.fallbackReason;
    let userFeatures = await this.featureStore.buildUserFeatures(userId);
    let contextFeatures = this.featureStore.buildContextFeatures(context);
    let restaurantFeatures: RestaurantFeatureVector[];

    try {
      restaurantFeatures = candidateResult.candidates.map((restaurant) =>
        this.featureStore.buildRestaurantFeatures(
          restaurant,
          context,
          userFeatures,
        ),
      );
    } catch {
      fallbackReason = fallbackReason ?? 'FEATURE_STORE_FAILURE';
      userFeatures = {
        userId,
        favoriteCuisines: [],
        preferredAmbiance: [],
        budgetLevel: null,
        cuisineAffinities: {},
        ambianceAffinities: {},
        budgetAffinity: {},
      };
      contextFeatures = this.featureStore.buildContextFeatures(context);
      restaurantFeatures = this.buildPopularNearbyFeatures(
        candidateResult.candidates,
        context,
      );
    }
    const scoringStartedAt = Date.now();
    let scored: Array<ScoredRestaurant>;

    try {
      scored = await this.scorer.score({
        userFeatures,
        restaurantFeatures,
        contextFeatures,
      });
    } catch {
      fallbackReason = fallbackReason ?? 'SCORER_FAILURE';
      scored = await this.popularNearbyScorer.score({
        userFeatures,
        restaurantFeatures,
        contextFeatures,
      });
    }
    fallbackReason =
      fallbackReason ??
      scored.find((score) => score.fallbackReason)?.fallbackReason;
    const scoringLatencyMs = Date.now() - scoringStartedAt;
    const selected = this.selectionService.select(
      scored,
      candidateResult.candidates,
      restaurantFeatures,
    );

    if (!selected.length) {
      throw new RecommendationError('No recommendation candidates found');
    }

    const session = await this.sessionRepository.createWithRecommendations({
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: candidateResult.radiusMeters,
      strategy:
        fallbackReason === 'PREDICTION_SERVICE_UNAVAILABLE'
          ? RecommendationStrategy.RuleBasedV1
          : fallbackReason
            ? RecommendationStrategy.PopularNearby
            : this.getStrategy(),
      modelVersion: fallbackReason
        ? RECOMMENDATION_MODEL_VERSION_NONE
        : this.getModelVersion(),
      featureVersion: RECOMMENDATION_FEATURE_VERSION,
      candidateCount: candidateResult.candidates.length,
      configSnapshot: {
        ...this.strategyConfigService.getConfig(),
      },
      fallbackReason,
      recommendations: selected.map((recommendation, index) => ({
        restaurantId: recommendation.restaurant.id,
        position: index + 1,
        score: recommendation.score,
        isPrimary: recommendation.isPrimary,
        scoreBreakdown: recommendation.scoreBreakdown,
      })),
    });
    const persistedByRestaurantId = new Map(
      session.recommendations.map((recommendation) => [
        recommendation.restaurantId,
        recommendation,
      ]),
    );
    const responseItems = selected.map((recommendation) => {
      const persisted = persistedByRestaurantId.get(
        recommendation.restaurant.id,
      );

      return {
        recommendationId: persisted?.recommendationId ?? '',
        restaurantId: recommendation.restaurant.id,
        name: recommendation.restaurant.name,
        score: recommendation.score,
        rating:
          recommendation.restaurant.google_rating === null
            ? null
            : Number(recommendation.restaurant.google_rating),
        ratingCount: recommendation.restaurant.google_rating_count,
        priceLevel: recommendation.restaurant.price_level,
        distanceMeters: Math.round(recommendation.feature.distanceMeters),
      };
    });

    this.monitoringService.logRecommendationRequest({
      userId,
      sessionId: session.sessionId,
      strategy:
        fallbackReason === 'PREDICTION_SERVICE_UNAVAILABLE'
          ? RecommendationStrategy.RuleBasedV1
          : fallbackReason
            ? RecommendationStrategy.PopularNearby
            : this.getStrategy(),
      featureVersion: RECOMMENDATION_FEATURE_VERSION,
      candidateCount: candidateResult.candidates.length,
      selectedCount: selected.length,
      radiusMeters: candidateResult.radiusMeters,
      googlePlacesLatencyMs: candidateResult.googlePlacesLatencyMs,
      scoringLatencyMs,
      totalLatencyMs: Date.now() - startedAt,
      fallbackReason,
    });

    return {
      sessionId: session.sessionId,
      strategy:
        fallbackReason === 'PREDICTION_SERVICE_UNAVAILABLE'
          ? RecommendationStrategy.RuleBasedV1
          : fallbackReason
            ? RecommendationStrategy.PopularNearby
            : this.getStrategy(),
      warning: candidateResult.warning,
      hero: responseItems[0] ?? null,
      secondary: responseItems.slice(1),
    };
  }

  private buildPopularNearbyFeatures(
    restaurants: RestaurantsModel[],
    context: { latitude: number; longitude: number; radiusMeters: number },
  ): RestaurantFeatureVector[] {
    return restaurants.map((restaurant) => {
      const distanceMeters = calculateDistanceMeters(
        { latitude: context.latitude, longitude: context.longitude },
        {
          latitude: Number(restaurant.latitude),
          longitude: Number(restaurant.longitude),
        },
      );

      return {
        restaurantId: restaurant.id,
        cuisineMatch: 0.5,
        budgetMatch: 0.5,
        ambianceMatch: 0.5,
        normalizedRating: clamp(Number(restaurant.google_rating ?? 0) / 5),
        normalizedDistance: clamp(1 - distanceMeters / context.radiusMeters),
        popularityScore: clamp(
          Math.log10(Number(restaurant.google_rating_count ?? 0) + 1) / 4,
        ),
        distanceMeters,
      };
    });
  }

  private getStrategy(): RecommendationStrategy {
    return this.configService.get<string>('RECOMMENDATION_SCORER') ===
      'tensorflow'
      ? RecommendationStrategy.TensorFlowV1
      : RecommendationStrategy.RuleBasedV1;
  }

  private getModelVersion(): string | null {
    if (this.getStrategy() !== RecommendationStrategy.TensorFlowV1) {
      return RECOMMENDATION_MODEL_VERSION_NONE;
    }

    return (
      this.configService.get<string>('RECOMMENDATION_MODEL_VERSION') ??
      'restaurant_ranker_v1'
    );
  }
}
