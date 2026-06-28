import { RecommendationInteractionType } from '../../domain/enums/recommendation-interaction-type.enum';
import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { UserProfileLearningService } from './user-profile-learning.service';

describe('UserProfileLearningService', () => {
  it('increments affinities for positive feedback and clamps values', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new UserProfileLearningService({
      findOrCreate: jest.fn().mockResolvedValue([
        {
          cuisine_affinities: { sushi: 0.95 },
          ambiance_affinities: { casual: 0.95 },
          budget_affinity: { '2': 0.95 },
          update,
        },
      ]),
    } as never);

    await service.applyFeedback({
      userId: 'user-1',
      type: RecommendationInteractionType.Rating,
      rating: 5,
      restaurant: {
        primary_type: 'sushi',
        types: ['restaurant'],
        price_level: 2,
        foodType: { name: 'Sushi' },
        placeType: { name: 'Casual' },
      } as RestaurantsModel,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        profile_version: 'user_profile_v1',
        cuisine_affinities: {
          sushi: 1,
          restaurant: 0.15,
        },
        ambiance_affinities: {
          casual: 1,
          sushi: 0.15,
        },
        budget_affinity: { '2': 1 },
      }),
    );
  });

  it('decrements affinities for negative feedback', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new UserProfileLearningService({
      findOrCreate: jest.fn().mockResolvedValue([
        {
          cuisine_affinities: { burger: 0 },
          ambiance_affinities: {},
          budget_affinity: { '4': 0 },
          update,
        },
      ]),
    } as never);

    await service.applyFeedback({
      userId: 'user-1',
      type: RecommendationInteractionType.Dislike,
      restaurant: {
        primary_type: 'burger',
        types: [],
        price_level: 4,
        foodType: null,
        placeType: null,
      } as unknown as RestaurantsModel,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        cuisine_affinities: { burger: -0.1 },
        ambiance_affinities: { burger: -0.1 },
        budget_affinity: { '4': -0.1 },
      }),
    );
  });

  it('ignores neutral rating feedback', async () => {
    const model = {
      findOrCreate: jest.fn(),
    };
    const service = new UserProfileLearningService(model as never);

    await service.applyFeedback({
      userId: 'user-1',
      type: RecommendationInteractionType.Rating,
      rating: 3,
      restaurant: {} as RestaurantsModel,
    });

    expect(model.findOrCreate).not.toHaveBeenCalled();
  });
});
