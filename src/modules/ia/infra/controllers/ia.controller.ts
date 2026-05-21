import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { RecommendationUseCase } from '../../app/use-cases/recommendation.use-case';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';

export interface RecommendationFilters {
  minRating?: number;
  foodTypes?: string[];
  restaurantStyles?: string[];
  minPrice?: number;
  maxPrice?: number;
}

@Controller('recommender')
export class IaController {
  constructor(private readonly recommendationUseCase: RecommendationUseCase) {}

  @Get('onboarding')
  async getRecommendationBasedOnboarding(
    @Query('userId') userId: string,
    @Query('minRating') minRating?: string,
    @Query('foodTypes') foodTypes?: string,
    @Query('restaurantStyles') restaurantStyles?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<RecommendationBasedOnboardingDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const filters: RecommendationFilters = {
      minRating: minRating ? Number(minRating) : undefined,
      foodTypes: foodTypes ? foodTypes.split(',').filter(Boolean) : undefined,
      restaurantStyles: restaurantStyles ? restaurantStyles.split(',').filter(Boolean) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };

    return await this.recommendationUseCase.getRecommendationBasedOnboarding(
      userId, filters,
    );
  }
}
