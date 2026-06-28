import { Injectable } from '@nestjs/common';
import { IRecommendationSessionRepository } from '@/modules/recommendation/domain/interfaces/repositories/recommendation-session-repository.interface';
import { RecommendationHistoryResponseDto } from '../dtos/response/recommendation-history-response.dto';

@Injectable()
export class ListRecommendationHistoryUseCase {
  constructor(
    private readonly sessionRepository: IRecommendationSessionRepository,
  ) {}

  async execute(userId: string): Promise<RecommendationHistoryResponseDto> {
    const sessions = await this.sessionRepository.listHistory(userId);

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        generatedAt: session.generatedAt.toISOString(),
        hero: session.hero,
        secondary: session.secondary,
      })),
    };
  }
}
