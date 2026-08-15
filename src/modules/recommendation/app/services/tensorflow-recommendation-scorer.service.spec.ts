import axios from 'axios';
import { TensorFlowRecommendationScorer } from './tensorflow-recommendation-scorer.service';

jest.mock('axios', () => {
  const post = jest.fn();

  return {
    __esModule: true,
    default: {
      post,
    },
    post,
  };
});

const mockedAxios = axios as unknown as { post: jest.Mock };

const input = {
  userFeatures: {
    userId: 'user-1',
    favoriteCuisines: [],
    preferredAmbiance: [],
    budgetLevel: null,
    cuisineAffinities: {},
    ambianceAffinities: {},
    budgetAffinity: {},
  },
  contextFeatures: {
    latitude: 0,
    longitude: 0,
    radiusMeters: 5000,
    requestedAt: new Date(),
    dayOfWeek: 1,
    hourOfDay: 12,
  },
  restaurantFeatures: [
    {
      restaurantId: 'restaurant-1',
      cuisineMatch: 1,
      budgetMatch: 1,
      ambianceMatch: 1,
      normalizedRating: 1,
      normalizedDistance: 1,
      popularityScore: 1,
      distanceMeters: 0,
    },
  ],
};

describe('TensorFlowRecommendationScorer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prediction service and normalizes returned scores', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        modelVersion: 'model-v1',
        featureVersion: 'restaurant_recommendation_v1',
        scores: [{ restaurantId: 'restaurant-1', score: 1.5 }],
      },
    });
    const scorer = new TensorFlowRecommendationScorer(
      {
        get: jest.fn((key: string) => {
          if (key === 'PREDICTION_SERVICE_URL') return 'http://localhost:8000/';
          if (key === 'RECOMMENDATION_MODEL_VERSION') return 'model-v1';
          if (key === 'PREDICTION_SERVICE_TOKEN') return 'secret-token';
          return undefined;
        }),
      } as never,
      { score: jest.fn() } as never,
    );

    const result = await scorer.score(input);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/predict',
      expect.objectContaining({
        modelVersion: 'model-v1',
        featureVersion: 'restaurant_recommendation_v1',
      }),
      {
        headers: { Authorization: 'Bearer secret-token' },
        timeout: 3000,
      },
    );
    expect(result).toEqual([
      {
        restaurantId: 'restaurant-1',
        score: 1,
        scoreBreakdown: { tensorflow: 1 },
      },
    ]);
  });

  it('falls back to rule-based scorer when prediction fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('offline'));
    const fallback = {
      score: jest
        .fn()
        .mockResolvedValue([{ restaurantId: 'fallback', score: 0.7 }]),
    };
    const scorer = new TensorFlowRecommendationScorer(
      {
        get: jest.fn((key: string) =>
          key === 'PREDICTION_SERVICE_URL'
            ? 'http://localhost:8000'
            : undefined,
        ),
      } as never,
      fallback as never,
    );

    await expect(scorer.score(input)).resolves.toEqual([
      {
        restaurantId: 'fallback',
        score: 0.7,
        fallbackReason: 'PREDICTION_SERVICE_UNAVAILABLE',
      },
    ]);
    expect(fallback.score).toHaveBeenCalledWith(input);
  });

  it.each([
    [
      'model mismatch',
      {
        modelVersion: 'other',
        featureVersion: 'restaurant_recommendation_v1',
        scores: [{ restaurantId: 'restaurant-1', score: 0.5 }],
      },
    ],
    [
      'feature mismatch',
      {
        modelVersion: 'restaurant_ranker_v1',
        featureVersion: 'other',
        scores: [{ restaurantId: 'restaurant-1', score: 0.5 }],
      },
    ],
    [
      'malformed score',
      {
        modelVersion: 'restaurant_ranker_v1',
        featureVersion: 'restaurant_recommendation_v1',
        scores: [{ restaurantId: 'restaurant-1', score: Number.NaN }],
      },
    ],
    [
      'score count mismatch',
      {
        modelVersion: 'restaurant_ranker_v1',
        featureVersion: 'restaurant_recommendation_v1',
        scores: [],
      },
    ],
  ])('falls back on %s', async (_name, response) => {
    mockedAxios.post.mockResolvedValue({ data: response });
    const fallback = {
      score: jest
        .fn()
        .mockResolvedValue([{ restaurantId: 'fallback', score: 0.7 }]),
    };
    const scorer = new TensorFlowRecommendationScorer(
      {
        get: jest.fn((key: string) =>
          key === 'PREDICTION_SERVICE_URL'
            ? 'http://localhost:8000'
            : undefined,
        ),
      } as never,
      fallback as never,
    );

    await expect(scorer.score(input)).resolves.toEqual([
      {
        restaurantId: 'fallback',
        score: 0.7,
        fallbackReason: 'PREDICTION_SERVICE_UNAVAILABLE',
      },
    ]);
  });
});
