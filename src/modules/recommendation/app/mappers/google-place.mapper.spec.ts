import { GooglePlaceMapper } from './google-place.mapper';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

describe('GooglePlaceMapper', () => {
  it('maps Google nearby search places to restaurant candidates', () => {
    const result = GooglePlaceMapper.toRestaurantCandidate({
      id: 'places/abc123',
      displayName: { text: 'Cantina Boa' },
      location: { latitude: -22.9, longitude: -47.06 },
      primaryType: 'restaurant',
      types: ['restaurant', 'italian_restaurant'],
      priceLevel: 'PRICE_LEVEL_MODERATE',
      rating: 4.6,
      userRatingCount: 120,
      businessStatus: 'OPERATIONAL',
      currentOpeningHours: { openNow: true },
    });

    expect(result).toEqual({
      provider: RestaurantProvider.GooglePlaces,
      providerPlaceId: 'places/abc123',
      name: 'Cantina Boa',
      location: { latitude: -22.9, longitude: -47.06 },
      types: ['restaurant', 'italian_restaurant'],
      primaryType: 'restaurant',
      priceLevel: 2,
      rating: 4.6,
      ratingCount: 120,
      businessStatus: 'OPERATIONAL',
      openNow: true,
    });
  });

  it('drops incomplete places instead of producing invalid candidates', () => {
    const result = GooglePlaceMapper.toRestaurantCandidate({
      id: 'places/abc123',
      displayName: { text: 'Cantina Boa' },
    });

    expect(result).toBeNull();
  });
});
