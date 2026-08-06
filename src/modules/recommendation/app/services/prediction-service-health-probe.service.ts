import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface PredictionHealthResponse {
  status: string;
  modelLoaded: boolean;
  modelVersion: string;
  featureVersion: string;
}

@Injectable()
export class PredictionServiceHealthProbe implements OnModuleInit {
  private readonly logger = new Logger(PredictionServiceHealthProbe.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (
      this.configService.get<string>('RECOMMENDATION_SCORER') !== 'tensorflow'
    ) {
      return;
    }

    const predictionServiceUrl = this.configService.get<string>(
      'PREDICTION_SERVICE_URL',
    );

    if (!predictionServiceUrl) {
      this.logger.warn(
        'TensorFlow scoring configured without PREDICTION_SERVICE_URL; requests will fall back to rule-based scoring.',
      );
      return;
    }

    try {
      const response = await axios.get<PredictionHealthResponse>(
        `${predictionServiceUrl.replace(/\/$/, '')}/health`,
        {
          headers: this.buildHeaders(),
          timeout: 2000,
        },
      );

      this.logger.log(
        JSON.stringify({
          event: 'prediction_service_health',
          url: predictionServiceUrl,
          ...response.data,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Prediction service health probe failed; requests will fall back as needed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private buildHeaders(): Record<string, string> {
    const token = this.configService.get<string>('PREDICTION_SERVICE_TOKEN');

    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
