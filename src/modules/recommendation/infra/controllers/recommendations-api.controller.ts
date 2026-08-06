import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { RecommendationError } from '../../domain/errors/recommendation.error';
import { PlacesProviderError } from '../../domain/errors/places-provider.error';
import { GenerateRecommendationsDto } from '../../app/dtos/request/generate-recommendations.dto';
import { RecommendationFeedbackDto } from '../../app/dtos/request/recommendation-feedback.dto';
import { GenerateRecommendationsResponseDto } from '../../app/dtos/response/generate-recommendations-response.dto';
import { RecommendationFeedbackResponseDto } from '../../app/dtos/response/recommendation-feedback-response.dto';
import { RecommendationHistoryResponseDto } from '../../app/dtos/response/recommendation-history-response.dto';
import { GenerateRecommendationsUseCase } from '../../app/use-cases/generate-recommendations.use-case';
import { ListRecommendationHistoryUseCase } from '../../app/use-cases/list-recommendation-history.use-case';
import { RecordRecommendationFeedbackUseCase } from '../../app/use-cases/record-recommendation-feedback.use-case';

@Controller('recommendations')
export class RecommendationsApiController {
  constructor(
    private readonly generateRecommendationsUseCase: GenerateRecommendationsUseCase,
    private readonly listHistoryUseCase: ListRecommendationHistoryUseCase,
    private readonly recordFeedbackUseCase: RecordRecommendationFeedbackUseCase,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async generateRecommendations(
    @Body() body: GenerateRecommendationsDto,
    @Req() req: Request & { user: UserModel },
  ): Promise<GenerateRecommendationsResponseDto> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    try {
      return await this.generateRecommendationsUseCase.execute(
        req.user.id,
        body,
      );
    } catch (error) {
      if (error instanceof RecommendationError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof PlacesProviderError) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }

  @Get('history')
  @UseGuards(FirebaseAuthGuard)
  async history(
    @Req() req: Request & { user: UserModel },
  ): Promise<RecommendationHistoryResponseDto> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    return this.listHistoryUseCase.execute(req.user.id);
  }

  @Post(':recommendationId/feedback')
  @UseGuards(FirebaseAuthGuard)
  async recordFeedback(
    @Param('recommendationId') recommendationId: string,
    @Body() body: RecommendationFeedbackDto,
    @Req() req: Request & { user: UserModel },
  ): Promise<RecommendationFeedbackResponseDto> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    return this.recordFeedbackUseCase.execute(
      req.user.id,
      recommendationId,
      body,
    );
  }
}
