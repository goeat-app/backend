import { RecommendationRequestPayloadDto } from "../../dtos/recommendation-request.dto";
import { RecommendationApiResponse } from "../../dtos/recommendation-api-response.dto";

export abstract class IIAService {
  abstract sendRecommendationBasedOnboarding(payload: RecommendationRequestPayloadDto): Promise<RecommendationApiResponse>;
}