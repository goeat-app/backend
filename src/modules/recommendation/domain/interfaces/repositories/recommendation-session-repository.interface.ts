import { RecommendationStrategy } from '../../enums/recommendation-strategy.enum';

export interface PersistRecommendationInput {
  restaurantId: string;
  score: number;
  position: number;
  isPrimary: boolean;
  scoreBreakdown?: Record<string, number>;
}

export interface CreateRecommendationSessionInput {
  userId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  strategy: RecommendationStrategy;
  modelVersion: string | null;
  featureVersion: string;
  candidateCount: number;
  configSnapshot?: Record<string, unknown>;
  fallbackReason?: string;
  recommendations: PersistRecommendationInput[];
}

export interface PersistedRecommendation {
  recommendationId: string;
  restaurantId: string;
  score: number;
  position: number;
  isPrimary: boolean;
  scoreBreakdown?: Record<string, number>;
}

export interface PersistedRecommendationSession {
  sessionId: string;
  strategy: RecommendationStrategy;
  featureVersion: string;
  generatedAt: Date;
  recommendations: PersistedRecommendation[];
}

export interface RecommendationHistoryItem {
  sessionId: string;
  generatedAt: Date;
  hero: {
    restaurantId: string;
    name: string;
  } | null;
  secondary: Array<{
    restaurantId: string;
    name: string;
  }>;
}

export abstract class IRecommendationSessionRepository {
  abstract createWithRecommendations(
    input: CreateRecommendationSessionInput,
  ): Promise<PersistedRecommendationSession>;

  abstract listHistory(
    userId: string,
    limit?: number,
  ): Promise<RecommendationHistoryItem[]>;

  abstract findRecentlyShownRestaurantIds(
    userId: string,
    since: Date,
  ): Promise<string[]>;

  abstract findRecentlyDislikedRestaurantIds(
    userId: string,
    since: Date,
  ): Promise<string[]>;
}
