import { RecommendationStrategyConfigService } from './recommendation-strategy-config.service';

describe('RecommendationStrategyConfigService', () => {
  it('returns defaults when env values are absent', () => {
    const service = new RecommendationStrategyConfigService({
      get: jest.fn().mockReturnValue(undefined),
    } as never);

    expect(service.getConfig()).toEqual({
      candidateGeneration: {
        defaultRadiusMeters: 5000,
        maxRadiusMeters: 12000,
        minimumCandidates: 20,
        idealCandidates: 50,
      },
      businessRules: {
        heroCount: 1,
        secondaryCount: 4,
        recentlyShownSuppressionHours: 24,
        minimumCuisineDiversity: 2,
      },
      scorer: 'rule_based',
      configVersion: 'recommendation_ops_v1',
    });
  });

  it('parses configured numeric strategy values', () => {
    const values: Record<string, string> = {
      RECOMMENDATION_DEFAULT_RADIUS_METERS: '3000',
      RECOMMENDATION_MAX_RADIUS_METERS: '9000',
      RECOMMENDATION_MINIMUM_CANDIDATES: '10',
      RECOMMENDATION_IDEAL_CANDIDATES: '25',
      RECOMMENDATION_HERO_COUNT: '1',
      RECOMMENDATION_SECONDARY_COUNT: '2',
      RECOMMENDATION_RECENTLY_SHOWN_SUPPRESSION_HOURS: '12',
      RECOMMENDATION_MINIMUM_CUISINE_DIVERSITY: '3',
      RECOMMENDATION_SCORER: 'tensorflow',
      RECOMMENDATION_CONFIG_VERSION: 'ops_v2',
    };
    const service = new RecommendationStrategyConfigService({
      get: jest.fn((key: string) => values[key]),
    } as never);

    expect(service.getConfig()).toEqual({
      candidateGeneration: {
        defaultRadiusMeters: 3000,
        maxRadiusMeters: 9000,
        minimumCandidates: 10,
        idealCandidates: 25,
      },
      businessRules: {
        heroCount: 1,
        secondaryCount: 2,
        recentlyShownSuppressionHours: 12,
        minimumCuisineDiversity: 3,
      },
      scorer: 'tensorflow',
      configVersion: 'ops_v2',
    });
  });
});
