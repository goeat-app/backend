import { PlacesProviderError } from '../../domain/errors/places-provider.error';
import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { CandidateGenerationService } from './candidate-generation.service';

describe('CandidateGenerationService', () => {
  it('falls back to cached nearby restaurants when Google Places fails', async () => {
    const cachedRestaurant = {
      id: 'restaurant-1',
      name: 'Cached Sushi',
      latitude: -22.9,
      longitude: -47.06,
      business_status: 'OPERATIONAL',
      open_now: true,
      primary_type: 'restaurant',
      types: ['restaurant'],
    } as RestaurantsModel;
    const service = new CandidateGenerationService(
      {
        syncNearbyRestaurants: jest
          .fn()
          .mockRejectedValue(new PlacesProviderError('offline')),
      } as never,
      {
        findCachedNearby: jest.fn().mockResolvedValue([cachedRestaurant]),
      } as never,
      {
        findRecentlyDislikedRestaurantIds: jest.fn().mockResolvedValue([]),
        findRecentlyShownRestaurantIds: jest.fn().mockResolvedValue([]),
      } as never,
      {
        getConfig: jest.fn().mockReturnValue({
          candidateGeneration: {
            defaultRadiusMeters: 5000,
            maxRadiusMeters: 5000,
            minimumCandidates: 20,
            idealCandidates: 50,
          },
          businessRules: {
            recentlyShownSuppressionHours: 24,
          },
        }),
        getCandidateGenerationConfig: jest.fn().mockReturnValue({
          defaultRadiusMeters: 5000,
          maxRadiusMeters: 5000,
        }),
      } as never,
      {
        logGooglePlacesFailure: jest.fn(),
      } as never,
    );

    const result = await service.generate({
      userId: 'user-1',
      latitude: -22.9,
      longitude: -47.06,
      radiusMeters: 5000,
    });

    expect(result).toMatchObject({
      candidates: [cachedRestaurant],
      radiusMeters: 5000,
      fallbackReason: 'GOOGLE_PLACES_UNAVAILABLE',
      warning: 'Google Places unavailable; using recently cached restaurants.',
    });
  });

  it('relaxes recently shown suppression when too few candidates remain', async () => {
    const restaurants = [
      {
        id: 'good',
        name: 'Good',
        latitude: -22.9,
        longitude: -47.06,
        business_status: 'OPERATIONAL',
        open_now: true,
        primary_type: 'restaurant',
        types: ['restaurant'],
      },
      {
        id: 'closed',
        name: 'Closed',
        latitude: -22.9,
        longitude: -47.06,
        business_status: 'OPERATIONAL',
        open_now: false,
        primary_type: 'restaurant',
        types: ['restaurant'],
      },
      {
        id: 'recent',
        name: 'Recent',
        latitude: -22.9,
        longitude: -47.06,
        business_status: 'OPERATIONAL',
        open_now: true,
        primary_type: 'restaurant',
        types: ['restaurant'],
      },
    ] as RestaurantsModel[];
    const service = new CandidateGenerationService(
      {
        syncNearbyRestaurants: jest.fn().mockResolvedValue(restaurants),
      } as never,
      {
        findCachedNearby: jest.fn(),
      } as never,
      {
        findRecentlyDislikedRestaurantIds: jest.fn().mockResolvedValue([]),
        findRecentlyShownRestaurantIds: jest.fn().mockResolvedValue(['recent']),
      } as never,
      {
        getConfig: jest.fn().mockReturnValue({
          candidateGeneration: {
            defaultRadiusMeters: 5000,
            maxRadiusMeters: 5000,
            minimumCandidates: 1,
            idealCandidates: 50,
          },
          businessRules: {
            recentlyShownSuppressionHours: 24,
          },
        }),
        getCandidateGenerationConfig: jest.fn().mockReturnValue({
          defaultRadiusMeters: 5000,
          maxRadiusMeters: 5000,
        }),
      } as never,
      {
        logGooglePlacesFailure: jest.fn(),
      } as never,
    );

    const result = await service.generate({
      userId: 'user-1',
      latitude: -22.9,
      longitude: -47.06,
    });

    expect(result.candidates.map((restaurant) => restaurant.id)).toEqual([
      'good',
      'recent',
    ]);
    expect(result.fallbackReason).toBe('RECENTLY_SHOWN_SUPPRESSION_RELAXED');
  });
});
