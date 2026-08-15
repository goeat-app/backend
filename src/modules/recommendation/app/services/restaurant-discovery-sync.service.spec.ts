import { RestaurantDiscoverySyncService } from './restaurant-discovery-sync.service';
import { PlacesProvider } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

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
});
