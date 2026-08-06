import { RecommendationStrategy } from '@/modules/recommendation/domain/enums/recommendation-strategy.enum';

export interface RecommendationResultItemDto {
  recommendationId: string;
  restaurantId: string;
  name: string;
  score: number;
  rating: number | null;
  ratingCount: number | null;
  priceLevel: number | null;
  distanceMeters: number;
}

export interface GenerateRecommendationsResponseDto {
  sessionId: string;
  strategy: RecommendationStrategy;
  warning?: string;
  hero: RecommendationResultItemDto | null;
  secondary: RecommendationResultItemDto[];
}
