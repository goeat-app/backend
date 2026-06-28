import axios from 'axios';
import { PredictionServiceHealthProbe } from './prediction-service-health-probe.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PredictionServiceHealthProbe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when tensorflow scorer is disabled', async () => {
    const probe = new PredictionServiceHealthProbe({
      get: jest.fn().mockReturnValue('rule_based'),
    } as never);

    await probe.onModuleInit();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('probes health with bearer token when tensorflow is enabled', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'ok',
        modelLoaded: true,
        modelVersion: 'restaurant_ranker_v1',
        featureVersion: 'restaurant_recommendation_v1',
      },
    });
    const values: Record<string, string> = {
      RECOMMENDATION_SCORER: 'tensorflow',
      PREDICTION_SERVICE_URL: 'http://localhost:8000/',
      PREDICTION_SERVICE_TOKEN: 'secret-token',
    };
    const probe = new PredictionServiceHealthProbe({
      get: jest.fn((key: string) => values[key]),
    } as never);

    await probe.onModuleInit();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      {
        headers: { Authorization: 'Bearer secret-token' },
        timeout: 2000,
      },
    );
  });

  it('does not throw when health probe fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('offline'));
    const probe = new PredictionServiceHealthProbe({
      get: jest.fn((key: string) =>
        key === 'RECOMMENDATION_SCORER'
          ? 'tensorflow'
          : key === 'PREDICTION_SERVICE_URL'
            ? 'http://localhost:8000'
            : undefined,
      ),
    } as never);

    await expect(probe.onModuleInit()).resolves.toBeUndefined();
  });
});
