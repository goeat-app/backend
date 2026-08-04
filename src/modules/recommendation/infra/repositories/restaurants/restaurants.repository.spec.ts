import { RestaurantRepository } from './restaurants.repository';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

describe('RestaurantRepository', () => {
  it('creates discovered Google restaurants with fallback address fields', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'restaurant-1' });
    const findOne = jest.fn().mockResolvedValue(null);
    const findAll = jest.fn().mockResolvedValue([]);

    const repository = new RestaurantRepository({
      findOne,
      create,
      findAll,
    } as any);

    await repository.upsertDiscoveredRestaurants([
      {
        provider: RestaurantProvider.GooglePlaces,
        providerPlaceId: 'place-123',
        name: 'Bistro do Centro',
        location: { latitude: -23.55, longitude: -46.63 },
        types: ['restaurant'],
        primaryType: 'restaurant',
        website: 'https://bistro.com',
        phone: '+5511999999999',
        whatsapp: '+5511999999999',
        description: 'Cozinha contemporanea.',
        imageUrl: 'https://cdn.example.com/photo.jpg',
        editorialSummary: 'Ambiente acolhedor.',
        editorialSummarySource: 'generated',
      } as any,
    ]);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: RestaurantProvider.GooglePlaces,
        provider_place_id: 'place-123',
        name: 'Bistro do Centro',
        address: null,
        latitude: -23.55,
        longitude: -46.63,
        city: 'Unknown',
        state: 'Unknown',
        postal_code: '00000',
        website: 'https://bistro.com',
        phone: '+5511999999999',
        whatsapp: '+5511999999999',
        description: 'Cozinha contemporanea.',
        image_url: 'https://cdn.example.com/photo.jpg',
        editorial_summary: 'Ambiente acolhedor.',
        editorial_summary_source: 'generated',
      }),
    );
  });
});
