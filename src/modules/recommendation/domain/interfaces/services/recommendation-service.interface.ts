import { RecommendationServiceRequestDto } from '@/modules/recommendation/app/dtos/request/recommendation-service-request.dto';
import { RecommendationServiceResponseDto } from '@/modules/recommendation/app/dtos/response/recommendation-service-response.dto';

export abstract class IRecommendationService {
  abstract execute(
    payload: RecommendationServiceRequestDto,
  ): Promise<RecommendationServiceResponseDto>;
}
