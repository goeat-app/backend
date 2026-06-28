import { NotFoundException } from '@nestjs/common';
import { RecommendationInteractionType } from '../../domain/enums/recommendation-interaction-type.enum';
import { RecordRecommendationFeedbackUseCase } from './record-recommendation-feedback.use-case';

describe('RecordRecommendationFeedbackUseCase', () => {
  it('records rating feedback, upserts rating, updates profile, and logs event', async () => {
    const restaurant = { id: 'restaurant-1' };
    const feedbackRepository = {
      findRecommendationForUser: jest.fn().mockResolvedValue({
        recommendationId: 'recommendation-1',
        restaurantId: 'restaurant-1',
        restaurant,
      }),
      createInteraction: jest.fn().mockResolvedValue(undefined),
      upsertFeedbackState: jest.fn().mockResolvedValue(undefined),
      upsertRestaurantRating: jest.fn().mockResolvedValue(undefined),
    };
    const profileLearning = {
      applyFeedback: jest.fn().mockResolvedValue(undefined),
    };
    const monitoring = {
      logFeedbackEvent: jest.fn(),
    };
    const useCase = new RecordRecommendationFeedbackUseCase(
      feedbackRepository as never,
      profileLearning as never,
      monitoring as never,
    );

    await expect(
      useCase.execute('user-1', 'recommendation-1', {
        type: RecommendationInteractionType.Rating,
        rating: 5,
      }),
    ).resolves.toEqual({ success: true });

    expect(feedbackRepository.createInteraction).toHaveBeenCalledWith({
      recommendationId: 'recommendation-1',
      userId: 'user-1',
      type: RecommendationInteractionType.Rating,
      rating: 5,
    });
    expect(feedbackRepository.upsertFeedbackState).toHaveBeenCalledWith({
      recommendationId: 'recommendation-1',
      userId: 'user-1',
      type: RecommendationInteractionType.Rating,
      rating: 5,
    });
    expect(feedbackRepository.upsertRestaurantRating).toHaveBeenCalledWith({
      userId: 'user-1',
      restaurantId: 'restaurant-1',
      rating: 5,
    });
    expect(profileLearning.applyFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      restaurant,
      type: RecommendationInteractionType.Rating,
      rating: 5,
    });
    expect(monitoring.logFeedbackEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      recommendationId: 'recommendation-1',
      type: RecommendationInteractionType.Rating,
      rating: 5,
    });
  });

  it('does not upsert restaurant rating for likes', async () => {
    const feedbackRepository = {
      findRecommendationForUser: jest.fn().mockResolvedValue({
        restaurantId: 'restaurant-1',
        restaurant: { id: 'restaurant-1' },
      }),
      createInteraction: jest.fn().mockResolvedValue(undefined),
      upsertFeedbackState: jest.fn().mockResolvedValue(undefined),
      upsertRestaurantRating: jest.fn(),
    };
    const useCase = new RecordRecommendationFeedbackUseCase(
      feedbackRepository as never,
      { applyFeedback: jest.fn().mockResolvedValue(undefined) } as never,
      { logFeedbackEvent: jest.fn() } as never,
    );

    await useCase.execute('user-1', 'recommendation-1', {
      type: RecommendationInteractionType.Like,
    });

    expect(feedbackRepository.upsertRestaurantRating).not.toHaveBeenCalled();
  });

  it('throws when the recommendation does not belong to the user', async () => {
    const useCase = new RecordRecommendationFeedbackUseCase(
      {
        findRecommendationForUser: jest.fn().mockResolvedValue(null),
      } as never,
      { applyFeedback: jest.fn() } as never,
      { logFeedbackEvent: jest.fn() } as never,
    );

    await expect(
      useCase.execute('user-1', 'recommendation-1', {
        type: RecommendationInteractionType.Dislike,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
