import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RecommenderRequestDto } from '../../dtos/recommender-request.dto';
import { SendRecommendationUseCase } from '../../app/use-cases/send-recommendation.use-case';

@Controller('recommender')
export class IaController {
  constructor(
    private readonly sendRecommendationUseCase: SendRecommendationUseCase,
  ) {}

  @Post('visited')
  @HttpCode(HttpStatus.OK)
  async getRecommendationBasedOnContent(@Body() recommendationData: RecommenderRequestDto) {
    const result =
      await this.sendRecommendationUseCase.getRecommendationBasedOnContent(
        recommendationData,
      );
    return { data: result };
  }
  @Post('profile')
  @HttpCode(HttpStatus.OK)
  async getRecommendationBasedOnProfiles(@Body() recommendationData: RecommenderRequestDto) {
    const result =
      await this.sendRecommendationUseCase.getRecommendationBasedOnProfiles(
        recommendationData,
      );
    return { data: result };
  }
}
