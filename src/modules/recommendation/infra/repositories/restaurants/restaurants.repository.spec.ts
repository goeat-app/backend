import { RestaurantRepository } from './restaurants.repository';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RestaurantDetails } from '@/modules/recommendation/domain/interfaces/places-provider.interface';

describe('RestaurantRepository', () => {
  it('creates discovered Google restaurants with fallback address fields', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'restaurant-1' });
    const findOne = jest.fn().mockResolvedValue(null);
    const findAll = jest.fn().mockResolvedValue([]);

    const repository = new RestaurantRepository({
      findOne,
      create,
      findAll,
    } as unknown as typeof RestaurantsModel);

    const candidates: RestaurantDetails[] = [
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
        photos: [
          {
            name: 'photo.jpg',
            widthPx: 1080,
            authorAttributionsNames: ['Bistro do Centro'],
          },
        ],
        editorialSummary: 'Ambiente acolhedor.',
        editorialSummarySource: 'generated',
      },
    ];

    await repository.upsertDiscoveredRestaurants(candidates);

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
        editorial_summary: 'Ambiente acolhedor.',
        editorial_summary_source: 'generated',
      }),
    );
  });
});
