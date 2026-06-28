export interface CandidateGenerationConfig {
  defaultRadiusMeters: number;
  maxRadiusMeters: number;
  minimumCandidates: number;
  idealCandidates: number;
}

export interface BusinessRulesConfig {
  heroCount: number;
  secondaryCount: number;
  recentlyShownSuppressionHours: number;
  minimumCuisineDiversity: number;
}

export interface RecommendationStrategyConfig {
  candidateGeneration: CandidateGenerationConfig;
  businessRules: BusinessRulesConfig;
  scorer: string;
  configVersion: string;
}

export interface RecommendationRequestMetrics {
  userId: string;
  sessionId: string;
  strategy: string;
  featureVersion: string;
  candidateCount: number;
  selectedCount: number;
  radiusMeters: number;
  googlePlacesLatencyMs: number;
  scoringLatencyMs: number;
  totalLatencyMs: number;
  fallbackReason?: string;
}
