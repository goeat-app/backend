import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BusinessRulesConfig,
  CandidateGenerationConfig,
  RecommendationStrategyConfig,
} from '@/modules/recommendation/domain/interfaces/recommendation-operations.interface';

@Injectable()
export class RecommendationStrategyConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): RecommendationStrategyConfig {
    return {
      candidateGeneration: this.getCandidateGenerationConfig(),
      businessRules: this.getBusinessRulesConfig(),
      scorer:
        this.configService.get<string>('RECOMMENDATION_SCORER') ?? 'rule_based',
      configVersion:
        this.configService.get<string>('RECOMMENDATION_CONFIG_VERSION') ??
        'recommendation_ops_v1',
    };
  }

  getCandidateGenerationConfig(): CandidateGenerationConfig {
    return {
      defaultRadiusMeters: this.getNumber(
        'RECOMMENDATION_DEFAULT_RADIUS_METERS',
        5000,
      ),
      maxRadiusMeters: this.getNumber(
        'RECOMMENDATION_MAX_RADIUS_METERS',
        12000,
      ),
      minimumCandidates: this.getNumber(
        'RECOMMENDATION_MINIMUM_CANDIDATES',
        20,
      ),
      idealCandidates: this.getNumber('RECOMMENDATION_IDEAL_CANDIDATES', 50),
    };
  }

  getBusinessRulesConfig(): BusinessRulesConfig {
    return {
      heroCount: this.getNumber('RECOMMENDATION_HERO_COUNT', 1),
      secondaryCount: this.getNumber('RECOMMENDATION_SECONDARY_COUNT', 4),
      recentlyShownSuppressionHours: this.getNumber(
        'RECOMMENDATION_RECENTLY_SHOWN_SUPPRESSION_HOURS',
        24,
      ),
      minimumCuisineDiversity: this.getNumber(
        'RECOMMENDATION_MINIMUM_CUISINE_DIVERSITY',
        2,
      ),
    };
  }

  private getNumber(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) ? value : fallback;
  }
}
