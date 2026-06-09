import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { IRecommendationService } from '@/modules/recommendation/domain/interfaces/services/recommendation-service.interface';
import { RecommendationServiceRequestDto } from '@/modules/recommendation/app/dtos/request/recommendation-service-request.dto';
import { RecommendationServiceResponseDto } from '@/modules/recommendation/app/dtos/response/recommendation-service-response.dto';
import { apiInstance } from '@/lib/infra/external/api';
import { ENDPOINTS } from '@/lib/constants/endpoints';

@Injectable()
export class RecommendationBasedOnboardingExternal implements IRecommendationService {
  constructor(private readonly configService: ConfigService) {}

  async execute(
    payload: RecommendationServiceRequestDto,
  ): Promise<RecommendationServiceResponseDto> {
    const baseURL = this.configService.get<string>('RECOMMENDER_SYSTEM_URL');
    const api = apiInstance(baseURL);

    try {
      const { data } = await api.post<RecommendationServiceResponseDto>(
        ENDPOINTS.RECOMMENDATION_ONBOARDING,
        payload,
      );

      return data;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to communicate with recommendation service',
      );
    }
  }
}
