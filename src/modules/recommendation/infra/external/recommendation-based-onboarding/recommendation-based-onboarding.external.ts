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
  private readonly logger = new Logger(
    RecommendationBasedOnboardingExternal.name,
  );
  constructor(private readonly configService: ConfigService) {}

  async execute(
    payload: RecommendationServiceRequestDto,
  ): Promise<RecommendationServiceResponseDto> {
    const baseURL = this.configService.get<string>('RECOMMENDER_SYSTEM_URL');

    const endpoint = ENDPOINTS.RECOMMENDATION_ONBOARDING;
    const api = apiInstance(baseURL);

    try {
      const response = await api.post<RecommendationServiceResponseDto>(
        endpoint,
        payload,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Failed to communicate with recommendation service at ${baseURL}${endpoint}: ${
            error.response?.status ?? error.code ?? 'unknown error'
          } ${JSON.stringify(error.response?.data ?? error.message)}`,
        );
      }

      this.logger.error(
        `Failed to communicate with recommendation service at ${baseURL}${endpoint}`,
      );
      throw new InternalServerErrorException(
        'Failed to communicate with recommendation service',
      );
    }
  }
}
