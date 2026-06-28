import { Injectable, Logger } from '@nestjs/common';
import { RecommendationRequestMetrics } from '@/modules/recommendation/domain/interfaces/recommendation-operations.interface';

@Injectable()
export class RecommendationMonitoringService {
  private readonly logger = new Logger(RecommendationMonitoringService.name);

  logRecommendationRequest(metrics: RecommendationRequestMetrics): void {
    this.logger.log(
      JSON.stringify({
        event: 'recommendation_request',
        ...metrics,
      }),
    );
  }

  logFeedbackEvent(input: {
    userId: string;
    recommendationId: string;
    type: string;
    rating?: number;
  }): void {
    this.logger.log(
      JSON.stringify({
        event: 'recommendation_feedback',
        ...input,
      }),
    );
  }

  logGooglePlacesFailure(input: {
    userId?: string;
    radiusMeters?: number;
    error: string;
  }): void {
    this.logger.warn(
      JSON.stringify({
        event: 'google_places_failure',
        ...input,
      }),
    );
  }

  logJobResult(input: {
    job: string;
    status: 'success' | 'failure';
    durationMs: number;
    processedCount?: number;
    error?: string;
  }): void {
    const payload = JSON.stringify({
      event: 'recommendation_background_job',
      ...input,
    });

    if (input.status === 'failure') {
      this.logger.error(payload);
      return;
    }

    this.logger.log(payload);
  }
}
