import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../../app/dtos/response/restaurant-recommendation-response.dto';
import { GetOnboardingRecommendationUseCase } from '../../app/use-cases/get-onboarding-recommendation.use-case';

@Controller('recommender')
export class RecommendationController {
  constructor(
    private readonly getOnboardingRecommendationUseCase: GetOnboardingRecommendationUseCase,
  ) {}

  @Get('onboarding')
  async getRecommendationBasedOnboarding(
    @Query('userId') userId: string,
  ): Promise<RestaurantRecommendationResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return await this.getOnboardingRecommendationUseCase.execute(userId);
  }
}
