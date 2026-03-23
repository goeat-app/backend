import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { RecommendationRequestPayloadDto } from '../../dtos/recommendation-request.dto';
import { IIAService } from '../../domain/interfaces/ia.service.interface';

@Injectable()
export class IAExternal implements IIAService {
  constructor(private readonly configService: ConfigService) { }

  async sendRecommendationBasedOnboarding(payload: RecommendationRequestPayloadDto) {
    const baseURL = this.configService.get<string>('RECOMMENDER_SYSTEM_URL');

    const api = axios.create({
      baseURL: baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    try {
      const result = await api.post('/api/recommender/onboarding', payload);
      return result.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const data = error.response?.data;
        console.error(`[IAExternal] Axios error: ${error.code} | status: ${status} | message: ${error.message}`);
        if (data) {
          console.error('[IAExternal] Response data:', JSON.stringify(data));
        }
      } else {
        console.error('[IAExternal] Unexpected error:', (error as Error).message);
      }
      throw new InternalServerErrorException('Failed to communicate with recommendation service');
    }
  }
}
