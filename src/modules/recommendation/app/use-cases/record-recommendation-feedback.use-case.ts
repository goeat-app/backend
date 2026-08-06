import { Injectable, NotFoundException } from '@nestjs/common';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import { IRecommendationFeedbackRepository } from '@/modules/recommendation/domain/interfaces/repositories/recommendation-feedback-repository.interface';
import { RecommendationFeedbackBody } from '../dtos/request/recommendation-feedback.dto';
import { RecommendationFeedbackResponseDto } from '../dtos/response/recommendation-feedback-response.dto';
import { UserProfileLearningService } from '../services/user-profile-learning.service';
import { RecommendationMonitoringService } from '../services/recommendation-monitoring.service';

@Injectable()
export class RecordRecommendationFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: IRecommendationFeedbackRepository,
    private readonly userProfileLearningService: UserProfileLearningService,
    private readonly monitoringService: RecommendationMonitoringService,
  ) {}

  async execute(
    userId: string,
    recommendationId: string,
    input: RecommendationFeedbackBody,
  ): Promise<RecommendationFeedbackResponseDto> {
    const target = await this.feedbackRepository.findRecommendationForUser(
      recommendationId,
      userId,
    );

    if (!target) {
      throw new NotFoundException('Recommendation not found');
    }

    await this.feedbackRepository.createInteraction({
      recommendationId,
      userId,
      type: input.type,
      rating:
        input.type === RecommendationInteractionType.Rating
          ? input.rating!
          : undefined,
    });
    await this.feedbackRepository.upsertFeedbackState({
      recommendationId,
      userId,
      type: input.type,
      rating:
        input.type === RecommendationInteractionType.Rating
          ? input.rating!
          : undefined,
    });

    if (input.type === RecommendationInteractionType.Rating) {
      await this.feedbackRepository.upsertRestaurantRating({
        userId,
        restaurantId: target.restaurantId,
        rating: input.rating!,
      });
    }

    await this.userProfileLearningService.applyFeedback({
      userId,
      restaurant: target.restaurant,
      type: input.type,
      rating:
        input.type === RecommendationInteractionType.Rating
          ? input.rating!
          : undefined,
    });

    this.monitoringService.logFeedbackEvent({
      userId,
      recommendationId,
      type: input.type,
      rating:
        input.type === RecommendationInteractionType.Rating
          ? input.rating
          : undefined,
    });

    return { success: true };
  }
}
