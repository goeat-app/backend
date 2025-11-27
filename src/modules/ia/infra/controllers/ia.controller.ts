import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RecommendationUseCase } from '../../app/use-cases/recommendation.use-case';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';

@Controller('recommender')
export class IaController {
  constructor(
    private readonly recommendationUseCase: RecommendationUseCase,
  ) {}

  @Get('onboarding')
  async getRecommendationBasedOnboarding(
    @Query('userId') userId: string,
  ): Promise<RecommendationBasedOnboardingDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return await this.recommendationUseCase.getRecommendationBasedOnboarding(userId);
  }
}
