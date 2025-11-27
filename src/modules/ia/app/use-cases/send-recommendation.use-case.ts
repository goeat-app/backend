import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RecommenderRequestDto } from '../../dtos/recommender-request.dto';
import { IaService } from '../../infra/external/ia.service';

@Injectable()
export class SendRecommendationUseCase {
  constructor(private readonly iaService: IaService) {}

  async getRecommendationBasedOnContent(dto: RecommenderRequestDto) {
    try {
      const result = await this.iaService.getContentRecommendations(dto);
      return result;
    } catch (err) {
      throw new InternalServerErrorException('Failed to send recommender request');
    }
  }
  async getRecommendationBasedOnProfiles(dto: RecommenderRequestDto) {
    try {
      const result = await this.iaService.getProfileBasedRecommendations(dto);
      return result;
    } catch (err) {
      throw new InternalServerErrorException('Failed to send recommender request');
    }
  }
}
