import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { axiosRequest } from '../../app/services/api/axios-request';
import { RecommenderPort } from '../../domain/ports/recommender.port';

@Injectable()
export class IaService implements RecommenderPort {
  private readonly logger = new Logger(IaService.name);
  // instantiate the axiosRequest wrapper with a real AxiosInstance
  private axiosInstance = new axiosRequest(axios.create());

  async getContentRecommendations(payload: any) {
    const result = await this.axiosInstance.post(
      process.env.RECOMMENDATION_CONTENT_API_URL!,
      payload,
    );
    return result;
  }

  async getProfileBasedRecommendations(payload: any) {
    const result = await this.axiosInstance.post(
      process.env.RECOMMENDATION_PROFILE_API_URL!,
      payload,
    );
    return result;
  }
}
