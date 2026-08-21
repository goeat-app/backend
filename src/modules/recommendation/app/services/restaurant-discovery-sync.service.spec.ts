import { RestaurantDiscoverySyncService } from './restaurant-discovery-sync.service';
import { PlacesProvider } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

jest.mock('p-limit', () => {
  const limiter = (concurrency: number) => {
    let active = 0;
    const queue: Array<() => void> = [];

    return async <T>(fn: () => Promise<T>): Promise<T> => {
      while (active >= concurrency) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }

      active += 1;
      try {
        return await fn();
      } finally {
        active -= 1;
        queue.shift()?.();
      }
    };
  };

  return {
    __esModule: true,
    default: limiter,
  };
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('RestaurantDiscoverySyncService', () => {
  it('fetches nearby restaurants, enriches with details and persists', async () => {
    const candidates = [
      {
        provider: RestaurantProvider.GooglePlaces,
        providerPlaceId: 'places/abc123',
        name: 'Cantina Boa',
        location: { latitude: -22.9, longitude: -47.06 },
        types: ['restaurant'],
      },
    ];
    const details = [
      {
        ...candidates[0],
        website: 'https://cantinaboa.com',
        phone: '(19) 3333-4444',
        whatsapp: '(19) 99999-0000',
        description: 'Massas e pizzas.',
        imageUrl: 'https://example.com/photo.jpg',
        editorialSummary: 'Restaurante tradicional.',
      },
    ];
    const placesProvider = {
      searchNearby: jest.fn().mockResolvedValue(candidates),
      getPlaceDetails: jest.fn().mockResolvedValue(details[0]),
    } as unknown as PlacesProvider;
    const restaurantRepository = {
      upsertDiscoveredRestaurants: jest.fn().mockResolvedValue([{ id: '1' }]),
    } as unknown as IRestaurantRepository;
    const service = new RestaurantDiscoverySyncService(
      placesProvider,
      restaurantRepository,
    );

    const result = await service.syncNearbyRestaurants({
      location: { latitude: -22.9, longitude: -47.06 },
      radiusMeters: 5000,
      maxResultCount: 20,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(placesProvider.searchNearby).toHaveBeenCalledWith({
      location: { latitude: -22.9, longitude: -47.06 },
      radiusMeters: 5000,
      maxResultCount: 20,
      includedTypes: ['restaurant'],
    });
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      restaurantRepository.upsertDiscoveredRestaurants,
    ).toHaveBeenCalledWith(details);
    expect(result).toEqual([{ id: '1' }]);
  });

  it('falls back to nearby candidate when details request fails', async () => {
    const candidates = [
      {
        provider: RestaurantProvider.GooglePlaces,
        providerPlaceId: 'places/abc123',
        name: 'Cantina Boa',
        location: { latitude: -22.9, longitude: -47.06 },
        types: ['restaurant'],
      },
    ];
    const placesProvider = {
      searchNearby: jest.fn().mockResolvedValue(candidates),
      getPlaceDetails: jest.fn().mockRejectedValue(new Error('boom')),
    } as unknown as PlacesProvider;
    const restaurantRepository = {
      upsertDiscoveredRestaurants: jest.fn().mockResolvedValue([{ id: '1' }]),
      findByProviderPlaceIds: jest.fn().mockResolvedValue(candidates),
    } as unknown as IRestaurantRepository;
    const service = new RestaurantDiscoverySyncService(
      placesProvider,
      restaurantRepository,
    );

    await service.syncNearbyRestaurants({
      location: { latitude: -22.9, longitude: -47.06 },
      radiusMeters: 5000,
    });

    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      restaurantRepository.upsertDiscoveredRestaurants,
    ).toHaveBeenCalledWith(candidates);
  });

  it('does not call persistence when discovery returns no candidates', async () => {
    const placesProvider = {
      searchNearby: jest.fn().mockResolvedValue([]),
    } as unknown as PlacesProvider;
    const restaurantRepository = {
      upsertDiscoveredRestaurants: jest.fn(),
    } as unknown as IRestaurantRepository;
    const service = new RestaurantDiscoverySyncService(
      placesProvider,
      restaurantRepository,
    );

    const result = await service.syncNearbyRestaurants({
      location: { latitude: -22.9, longitude: -47.06 },
      radiusMeters: 5000,
    });

    expect(result).toEqual([]);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      restaurantRepository.upsertDiscoveredRestaurants,
    ).not.toHaveBeenCalled();
  });

  it('limits image processing concurrency to five operations', async () => {
    const placesProvider = {
      searchNearby: jest.fn().mockResolvedValue([]),
      getPlaceDetails: jest.fn(),
      getAndSaveImageByName: jest.fn(),
    } as unknown as PlacesProvider;
    const restaurantRepository = {
      upsertDiscoveredRestaurants: jest.fn().mockResolvedValue(
        Array.from({ length: 6 }, (_, index) => ({
          id: `${index + 1}`,
          provider_place_id: `place-${index + 1}`,
        })),
      ),
      updateRestaurantDetails: jest
        .fn()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await
        .mockImplementation(async (_id, payload) => ({
          id: _id,
          ...payload,
        })),
      findByProviderPlaceIds: jest.fn().mockResolvedValue([]),
    } as unknown as IRestaurantRepository;
    const service = new RestaurantDiscoverySyncService(
      placesProvider,
      restaurantRepository,
    );

    const activeOperations: number[] = [];
    const maxActiveOperations: number[] = [];

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    (
      placesProvider as unknown as {
        getAndSaveImageByName: jest.Mock;
      }
    ).getAndSaveImageByName.mockImplementation(async () => {
      const currentActive = activeOperations.length + 1;
      activeOperations.push(currentActive);
      maxActiveOperations.push(currentActive);

      await delay(10);
      activeOperations.pop();
      return 'stored/path';
    });

    const details = Array.from({ length: 6 }, (_, index) => ({
      providerPlaceId: `place-${index + 1}`,
      name: `Restaurant ${index + 1}`,
      location: { latitude: 0, longitude: 0 },
      types: ['restaurant'],
      photos: [
        {
          name: `photo-${index + 1}`,
          widthPx: 100,
          authorAttributionsNames: ['Restaurant 1'],
        },
      ],
      provider: RestaurantProvider.GooglePlaces,
    }));

    (
      placesProvider as unknown as { getPlaceDetails: jest.Mock }
    ).getPlaceDetails.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (placeId: string) =>
        details.find((detail) => detail.providerPlaceId === placeId) ??
        details[0],
    );

    await service.syncNearbyRestaurants({
      location: { latitude: -22.9, longitude: -47.06 },
      radiusMeters: 5000,
    });
    await flushPromises();

    expect(Math.max(...maxActiveOperations)).toBeLessThanOrEqual(5);
  });
});
