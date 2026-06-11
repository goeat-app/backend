import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';
import { GetOnboardingRecommendationUseCase } from '../../../recommendation/app/use-cases/get-onboarding-recommendation.use-case';

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
  ): Promise<RecommendationBasedOnboardingDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const recommendations =
      await this.getOnboardingRecommendationUseCase.execute(userId);
    return recommendations;
  }
}
