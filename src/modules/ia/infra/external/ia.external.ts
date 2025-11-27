import { Injectable } from '@nestjs/common';
import { api } from '../../app/services/api/api';
import { RecommendationRequestPayloadDto } from '../../dtos/recommendation-request.dto';
import { IIAService } from '../../domain/interfaces/ia.service.interface';

@Injectable()
export class IAExternal implements IIAService {

  async sendRecommendationBasedOnboarding(payload: RecommendationRequestPayloadDto) {
    try {
      const result = await api.post("/onboarding", payload);
      return result.data;
    } catch (error) {
      throw error;
    }
  }
}
