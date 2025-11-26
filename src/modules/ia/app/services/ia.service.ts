import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);

  async getContentRecommendations(payload) {
    try {
      const res = await axios.post(process.env.RECOMMENDATION_VISITED_API_URL!, payload,
        {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (err) {
      this.logger.error(
        'Error sending payload to recommender',
        err?.stack ?? err,
      );
      throw err;
    }
  }

  async getProfileBasedRecommendations(payload) {
    try {
      const res = await axios.post(process.env.RECOMMENDATION_PROFILE_API_URL!, payload,
        {
        headers: { 'Content-Type': 'application/json' },
      });
      return res.data;
    } catch (err) {
      this.logger.error(
        'Error sending payload to profile recommender',
        err?.stack ?? err,
      );
      throw err;
    }
}
}
