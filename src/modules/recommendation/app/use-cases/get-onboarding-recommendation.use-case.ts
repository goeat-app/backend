import { Injectable, Logger } from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../dtos/response/restaurant-recommendation-response.dto';
import { IUserPreferenceRepository } from '../../domain/interfaces/repositories/user-preference-repository.interface';
import { RestaurantOnboardingMapper } from '../mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { IRecommendationService } from '../../domain/interfaces/services/recommendation-service.interface';
import { IRestaurantRepository } from '../../domain/interfaces/repositories/restaurant-repository.interface';
import { IReviewRepository } from '../../domain/interfaces/repositories/review-repository.interface';
import { RestaurantQueryFilters } from '../../domain/types/restaurant-query-filters.type';
import { resolveRestaurantFilters } from '../helpers/resolve-restaurant-filters.helper';

@Injectable()
export class GetOnboardingRecommendationUseCase {
  private readonly logger = new Logger(GetOnboardingRecommendationUseCase.name);

  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly userPreferenceRepository: IUserPreferenceRepository,
    private readonly recommendationService: IRecommendationService,
  ) {}

  async execute(
    userId: string,
    sessionFilters?: RestaurantQueryFilters,
  ): Promise<RestaurantRecommendationResponseDto[]> {
    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

    const filters = resolveRestaurantFilters(sessionFilters, preferences);

    const restaurants =
      await this.restaurantRepository.findAllActiveRestaurants(filters);

    const reviews = await this.reviewRepository.findAllReviews();

    if (!preferences) {
      this.logger.warn(
        'No user preferences found for onboarding recommendations, falling back to local restaurants',
      );
      return RestaurantOnboardingMapper.toResponseDto(restaurants);
    }

    const servicePayload = RestaurantOnboardingMapper.toServiceRequest(
      restaurants,
      reviews,
      preferences,
    );

    try {
      const result = await this.recommendationService.execute(servicePayload);

      if (!result.restaurants.length) {
        return RestaurantOnboardingMapper.toResponseDto(restaurants);
      }

      const recommended = await this.restaurantRepository.findByIds(
        result.restaurants.map((restaurant) => restaurant.restaurantId),
      );

      return RestaurantOnboardingMapper.toResponseDto(recommended);
    } catch (error) {
      this.logger.warn(
        `Onboarding recommendation service failed, falling back to local restaurants: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      return RestaurantOnboardingMapper.toResponseDto(restaurants);
    }
  }
}
