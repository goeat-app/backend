import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';
import { GetOnboardingRecommendationUseCase } from '@/modules/recommendation/app/use-cases/get-onboarding-recommendation.use-case';

export interface RecommendationFilters {
  minRating?: number;
  foodTypes?: string[];
  restaurantStyles?: string[];
  minPrice?: number;
  maxPrice?: number;
}

@Controller('recommender')
export class IaController {
  constructor(
    private readonly getOnboardingRecommendationUseCase: GetOnboardingRecommendationUseCase,
  ) {}

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
      restaurantStyles: restaurantStyles
        ? restaurantStyles.split(',').filter(Boolean)
        : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    };

    return await this.getOnboardingRecommendationUseCase.execute(userId);
  }
}
