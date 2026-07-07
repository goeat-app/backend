import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../dtos/response/restaurant-recommendation-response.dto';
import { IUserPreferenceRepository } from '../../domain/interfaces/repositories/user-preference-repository.interface';
import { RestaurantOnboardingMapper } from '../mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { IRecommendationService } from '../../domain/interfaces/services/recommendation-service.interface';
import { IRestaurantRepository } from '../../domain/interfaces/repositories/restaurant-repository.interface';
import { IReviewRepository } from '../../domain/interfaces/repositories/review-repository.interface';
import { RestaurantQueryFilters } from '../../domain/types/restaurant-query-filters.type';
import { resolveRestaurantFilters } from '../helpers/resolve-restaurant-filters.helper';
import { RestaurantDiscoverySyncService } from '../services/restaurant-discovery-sync.service';
import { PlacesProviderError } from '../../domain/errors/places-provider.error';

const DEFAULT_DISCOVERY_RADIUS_METERS = 5000;
const DEFAULT_DISCOVERY_MAX_RESULT_COUNT = 20;

@Injectable()
export class GetOnboardingRecommendationUseCase {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly userPreferenceRepository: IUserPreferenceRepository,
    private readonly recommendationService: IRecommendationService,
    private readonly discoverySyncService: RestaurantDiscoverySyncService,
  ) {}

  async execute(
    userId: string,
    sessionFilters?: RestaurantQueryFilters,
    currentLocation?: { latitude: number; longitude: number },
  ): Promise<RestaurantRecommendationResponseDto[]> {
    try {
      const preferences =
        await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

      if (!preferences) {
        throw new NotFoundException('User preferences not found');
      }

      const preferencesLocation =
        preferences.latitude && preferences.longitude
          ? { latitude: preferences.latitude, longitude: preferences.longitude }
          : undefined;

      await this.syncNearbyFromPreferences(
        currentLocation || preferencesLocation,
      );

      const filters = resolveRestaurantFilters(sessionFilters, preferences);

      const restaurants =
        await this.restaurantRepository.findAllActiveRestaurants(filters);

      const reviews = await this.reviewRepository.findAllReviews();

      const servicePayload = RestaurantOnboardingMapper.toServiceRequest(
        restaurants,
        reviews,
        preferences,
      );

      const result = await this.recommendationService.execute(servicePayload);

      if (!result.restaurants.length) {
        return RestaurantOnboardingMapper.toResponseDto(restaurants);
      }

      const recommended = await this.restaurantRepository.findByIds(
        result.restaurants.map((restaurant) => restaurant.restaurantId),
      );

      return RestaurantOnboardingMapper.toResponseDto(recommended);
    } catch (error) {
      if (error instanceof PlacesProviderError) {
        return [];
      }
      throw error;
    }
  }

  private async syncNearbyFromPreferences(
    location: { latitude: number; longitude: number } | undefined,
  ): Promise<void> {
    if (!location) return;

    try {
      await this.discoverySyncService.syncNearbyRestaurants({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radiusMeters: DEFAULT_DISCOVERY_RADIUS_METERS,
        maxResultCount: DEFAULT_DISCOVERY_MAX_RESULT_COUNT,
      });
    } catch (error) {
      if (error instanceof PlacesProviderError) return;
      throw error;
    }
  }
}
