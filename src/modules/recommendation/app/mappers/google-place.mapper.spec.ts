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

  it('maps address components into city, state and postal code', () => {
    const result = GooglePlaceMapper.toRestaurantCandidate({
      id: 'places/abc123',
      displayName: { text: 'Cantina Boa' },
      location: { latitude: -22.9, longitude: -47.06 },
      addressComponents: [
        { longText: 'Paulista', types: ['route'] },
        { longText: '1578', types: ['street_number'] },
        { longText: 'São Paulo', types: ['locality'] },
        { longText: 'São Paulo', types: ['administrative_area_level_2'] },
        { longText: 'São Paulo', types: ['administrative_area_level_1'] },
        { longText: '01000-000', types: ['postal_code'] },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({
        address: 'Paulista, 1578',
        city: 'São Paulo',
        state: 'São Paulo',
        postalCode: '01000-000',
      }),
    );
  });

  it('uses administrative_area_level_2 as city fallback without polluting state', () => {
    const result = GooglePlaceMapper.toRestaurantCandidate({
      id: 'places/fallback123',
      displayName: { text: 'Casa do Sabor' },
      location: { latitude: -22.9, longitude: -47.06 },
      addressComponents: [
        { longText: 'Campinas', types: ['administrative_area_level_2'] },
        { longText: 'São Paulo', types: ['administrative_area_level_1'] },
      ],
    });

    expect(result).toEqual(
      expect.objectContaining({
        city: 'Campinas',
        state: 'São Paulo',
      }),
    );
  });

  it('drops incomplete places instead of producing invalid candidates', () => {
    const result = GooglePlaceMapper.toRestaurantCandidate({
      id: 'places/abc123',
      displayName: { text: 'Cantina Boa' },
    });

    expect(result).toBeNull();
  });

  it('maps place details including website, phones, summaries and photo metadata', () => {
    const result = GooglePlaceMapper.toRestaurantDetails(
      {
        id: 'places/abc123',
        displayName: { text: 'Cantina Boa' },
        location: { latitude: -22.9, longitude: -47.06 },
        types: ['restaurant'],
        websiteUri: 'https://cantinaboa.com',
        nationalPhoneNumber: '(11) 99999-0000',
        editorialSummary: { text: 'Tradicional cantina familiar.' },
        generativeSummary: { overview: { text: 'Massas artesanais.' } },
        photos: [
          {
            name: 'places/abc123/photos/photo1',
            widthPx: 600,
            authorAttributions: [{ displayName: 'Cantina Boa' }],
          },
        ],
      },
      { googleApiKey: 'fake-key' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        website: 'https://cantinaboa.com',
        phone: '(11) 99999-0000',
        whatsapp: '(11) 99999-0000',
        description: 'Massas artesanais.',
        editorialSummary: 'Tradicional cantina familiar.',
        editorialSummarySource: 'google',
        photos: [
          {
            name: 'places/abc123/photos/photo1',
            widthPx: 600,
            authorAttributionsNames: ['Cantina Boa'],
          },
        ],
      }),
    );
  });

  it('generates description and editorial summary when Google text is missing', () => {
    const result = GooglePlaceMapper.toRestaurantDetails({
      id: 'places/xyz987',
      displayName: { text: 'Bistro Central' },
      location: { latitude: -23.55, longitude: -46.63 },
      primaryType: 'restaurant',
      types: ['restaurant'],
      priceLevel: 'PRICE_LEVEL_MODERATE',
      rating: 4.3,
      userRatingCount: 87,
      currentOpeningHours: { openNow: true },
      addressComponents: [{ longText: 'Campinas', types: ['locality'] }],
    });

    expect(result).toEqual(
      expect.objectContaining({
        editorialSummarySource: 'generated',
      }),
    );
    expect(result?.description).toContain('Bistro Central');
    expect(result?.editorialSummary).toContain('Restaurant');
  });
});
