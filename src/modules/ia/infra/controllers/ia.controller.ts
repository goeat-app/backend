import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';
import { GetOnboardingRecommendationUseCase } from '@modules/recommendation/app/use-cases/get-onboarding-recommendation.use-case';
import { UserModel } from '@/modules/auth/infra/database/user.model';

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
    @Req() req: Request & { user: UserModel },
  ): Promise<RecommendationBasedOnboardingDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const recommendations =
      await this.getOnboardingRecommendationUseCase.execute(userId);
    return recommendations;
  }
}
