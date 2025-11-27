import { Injectable, Logger } from '@nestjs/common';
import { api } from '../../app/services/api/api';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  async getContentRecommendations(payload: any) {
    try {
      const result = await api.post("/similar", payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      this.logger.log('Content recommendation received from external API');
      return result.data;
    } catch (error) {
      this.logger.error('Error fetching content recommendations', error);
      throw error;
    }
  }

  async getProfileBasedRecommendations(payload: any) {
    try {
      const result = await api.post("/profile", payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      this.logger.log('Profile-based recommendation received from external API');
      return result.data;
    } catch (error) {
      this.logger.error('Error fetching profile-based recommendations', error);
      throw error;
    }
  }
}
