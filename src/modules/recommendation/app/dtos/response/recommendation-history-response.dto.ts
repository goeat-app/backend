export interface RecommendationHistoryResponseDto {
  sessions: Array<{
    sessionId: string;
    generatedAt: string;
    hero: {
      restaurantId: string;
      name: string;
    } | null;
    secondary: Array<{
      restaurantId: string;
      name: string;
    }>;
  }>;
}
