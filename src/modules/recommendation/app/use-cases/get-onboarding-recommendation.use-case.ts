import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../dtos/response/restaurant-recommendation-response.dto';
import { IUserPreferenceRepository } from '../../domain/interfaces/repositories/user-preference-repository.interface';
import { RestaurantOnboardingMapper } from '../mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { IRecommendationService } from '../../domain/interfaces/services/recommendation-service.interface';
import { IRestaurantRepository } from '../../domain/interfaces/repositories/restaurant-repository.interface';
import { IReviewRepository } from '../../domain/interfaces/repositories/review-repository.interface';

@Injectable()
export class GetOnboardingRecommendationUseCase {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly userPreferenceRepository: IUserPreferenceRepository,
    private readonly recommendationService: IRecommendationService,
  ) {}

  async execute(
    userId: string,
  ): Promise<RestaurantRecommendationResponseDto[]> {
    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    const restaurants =
      await this.restaurantRepository.findAllActiveRestaurants();

    const reviews = await this.reviewRepository.findAllReviews();

    const servicePayload = RestaurantOnboardingMapper.toServiceRequest(
      restaurants,
      reviews,
      preferences,
    );

    const result = await this.recommendationService.execute(servicePayload);

    if (!result.restaurants.length) {
      return [];
    }

    const recommended = await this.restaurantRepository.findByIds(
      result.restaurants.map((restaurant) => restaurant.restaurantId),
    );

    return RestaurantOnboardingMapper.toResponseDto(recommended);
  }
}
