import { Injectable } from '@nestjs/common';
import { IRecommendationSessionRepository } from '@/modules/recommendation/domain/interfaces/repositories/recommendation-session-repository.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { PlacesProviderError } from '@/modules/recommendation/domain/errors/places-provider.error';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RestaurantDiscoverySyncService } from './restaurant-discovery-sync.service';
import { calculateDistanceMeters } from '../utils/distance';
import { RecommendationStrategyConfigService } from './recommendation-strategy-config.service';
import { RecommendationMonitoringService } from './recommendation-monitoring.service';

interface GenerateCandidatesInput {
  userId: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface CandidateGenerationResult {
  candidates: RestaurantsModel[];
  radiusMeters: number;
  googlePlacesLatencyMs: number;
  warning?: string;
  fallbackReason?: string;
}

@Injectable()
export class CandidateGenerationService {
  constructor(
    private readonly discoverySyncService: RestaurantDiscoverySyncService,
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly sessionRepository: IRecommendationSessionRepository,
    private readonly strategyConfigService: RecommendationStrategyConfigService,
    private readonly monitoringService: RecommendationMonitoringService,
  ) {}

  async generate(
    input: GenerateCandidatesInput,
  ): Promise<CandidateGenerationResult> {
    const config = this.strategyConfigService.getConfig();
    const radii = this.buildRadiusPlan(input.radiusMeters);
    const dislikedIds =
      await this.sessionRepository.findRecentlyDislikedRestaurantIds(
        input.userId,
        this.hoursAgo(24 * 30),
      );
    const recentlyShownIds =
      await this.sessionRepository.findRecentlyShownRestaurantIds(
        input.userId,
        this.hoursAgo(config.businessRules.recentlyShownSuppressionHours),
      );
    let lastWarning: string | undefined;
    let fallbackReason: string | undefined;
    let googlePlacesLatencyMs = 0;

    for (const radiusMeters of radii) {
      let restaurants: RestaurantsModel[];

      try {
        const startedAt = Date.now();
        restaurants = await this.discoverySyncService.syncNearbyRestaurants({
          location: { latitude: input.latitude, longitude: input.longitude },
          radiusMeters,
          maxResultCount: config.candidateGeneration.idealCandidates,
        });
        googlePlacesLatencyMs += Date.now() - startedAt;
      } catch (error) {
        if (!(error instanceof PlacesProviderError)) throw error;

        fallbackReason = 'GOOGLE_PLACES_UNAVAILABLE';
        lastWarning =
          'Google Places unavailable; using recently cached restaurants.';
        this.monitoringService.logGooglePlacesFailure({
          userId: input.userId,
          radiusMeters,
          error: error.message,
        });
        restaurants = await this.restaurantRepository.findCachedNearby({
          location: { latitude: input.latitude, longitude: input.longitude },
          radiusMeters,
        });
      }

      const filtered = this.applyHardFilters(restaurants, {
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters,
        dislikedIds,
        recentlyShownIds,
      });

      if (
        filtered.length >= config.candidateGeneration.minimumCandidates ||
        radiusMeters === radii.at(-1)
      ) {
        const relaxed =
          filtered.length >= 5
            ? filtered
            : this.applyHardFilters(restaurants, {
                latitude: input.latitude,
                longitude: input.longitude,
                radiusMeters,
                dislikedIds,
                recentlyShownIds: [],
              });

        return {
          candidates: relaxed,
          radiusMeters,
          googlePlacesLatencyMs,
          warning:
            lastWarning ??
            (relaxed.length < 5
              ? 'Fewer than five recommendation candidates are available.'
              : undefined),
          fallbackReason:
            fallbackReason ??
            (relaxed.length > filtered.length
              ? 'RECENTLY_SHOWN_SUPPRESSION_RELAXED'
              : undefined),
        };
      }
    }

    return {
      candidates: [],
      radiusMeters:
        radii.at(-1) ?? config.candidateGeneration.defaultRadiusMeters,
      googlePlacesLatencyMs,
      warning: lastWarning,
      fallbackReason,
    };
  }

  private applyHardFilters(
    restaurants: RestaurantsModel[],
    input: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
      dislikedIds: string[];
      recentlyShownIds: string[];
    },
  ): RestaurantsModel[] {
    return restaurants.filter((restaurant) => {
      if (!restaurant.latitude || !restaurant.longitude) return false;
      if (
        restaurant.business_status &&
        restaurant.business_status !== 'OPERATIONAL'
      ) {
        return false;
      }
      if (restaurant.open_now === false) return false;
      if (
        !restaurant.name ||
        !(restaurant.types?.length || restaurant.primary_type)
      ) {
        return false;
      }
      if (input.dislikedIds.includes(restaurant.id)) return false;
      if (input.recentlyShownIds.includes(restaurant.id)) return false;

      const distanceMeters = calculateDistanceMeters(
        { latitude: input.latitude, longitude: input.longitude },
        {
          latitude: Number(restaurant.latitude),
          longitude: Number(restaurant.longitude),
        },
      );

      return distanceMeters <= input.radiusMeters;
    });
  }

  private buildRadiusPlan(radiusMeters?: number): number[] {
    const config = this.strategyConfigService.getCandidateGenerationConfig();
    const defaultRadius = config.defaultRadiusMeters;
    const maxRadius = config.maxRadiusMeters;
    const middleRadius = Math.min(
      maxRadius,
      Math.max(defaultRadius, Math.round(defaultRadius * 1.6)),
    );
    const expandedRadii = [
      ...new Set([defaultRadius, middleRadius, maxRadius]),
    ];

    if (!radiusMeters || radiusMeters === defaultRadius) {
      return expandedRadii;
    }

    return [
      radiusMeters,
      ...expandedRadii.filter((radius) => radius > radiusMeters),
    ];
  }

  private hoursAgo(hours: number): Date {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  }
}
