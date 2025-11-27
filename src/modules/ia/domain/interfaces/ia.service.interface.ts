import { RecommenderRequestDto, RecommenderResponseDto } from "../../dtos/recommender-request.dto";

export abstract class IaService {
  abstract getRecommendationBasedOnContent(
    recommendationData: RecommenderRequestDto,
  ): Promise<RecommenderResponseDto>;
  abstract getRecommendationBasedOnProfiles(
    recommendationData: RecommenderRequestDto,
  ): Promise<RecommenderResponseDto>;
}