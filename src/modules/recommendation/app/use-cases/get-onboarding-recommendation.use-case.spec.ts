import { GetOnboardingRecommendationUseCase } from './get-onboarding-recommendation.use-case';
import { RestaurantsModel } from '../../infra/database/restaurant.model';

describe('GetOnboardingRecommendationUseCase', () => {
  it('falls back to local restaurants when the onboarding service fails', async () => {
    const restaurant = {
      get: jest.fn().mockReturnValue({
        id: 'restaurant-1',
        address: 'Rua A',
        average_price: 40,
        average_rating: 4.5,
        city: 'Campinas',
        description: null,
        foodType: { name: 'Brasileira' },
        is_active: true,
        latitude: -22.9,
        longitude: -47.06,
        name: 'Restaurante A',
        phone: null,
        placeType: { name: 'Bistrô', slug: 'bistro-env' },
        state: 'SP',
        slug: 'restaurante-a',
        image_url: null,
        whatsapp: null,
      }),
    } as unknown as RestaurantsModel;

    const useCase = new GetOnboardingRecommendationUseCase(
      {
        findAllActiveRestaurants: jest.fn().mockResolvedValue([restaurant]),
        findByIds: jest.fn().mockResolvedValue([restaurant]),
      } as never,
      { findAllReviews: jest.fn().mockResolvedValue([]) } as never,
      {
        findUserPreferencesByUserId: jest.fn().mockResolvedValue({
          preferredPlaceTypes: [],
          preferredFoodTypes: [],
          maxPrice: null,
        }),
      } as never,
      {
        execute: jest.fn().mockRejectedValue(new Error('service unavailable')),
      } as never,
    );

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'restaurant-1',
      name: 'Restaurante A',
    });
  });

  it('falls back to local restaurants when user preferences are missing', async () => {
    const restaurant = {
      get: jest.fn().mockReturnValue({
        id: 'restaurant-2',
        address: 'Rua B',
        average_price: 35,
        average_rating: 4.2,
        city: 'São Paulo',
        description: null,
        foodType: { name: 'Italiana' },
        is_active: true,
        latitude: -23.5,
        longitude: -46.6,
        name: 'Restaurante B',
        phone: null,
        placeType: { name: 'Pizzaria', slug: 'pizzaria' },
        state: 'SP',
        slug: 'restaurante-b',
        image_url: null,
        whatsapp: null,
      }),
    } as unknown as RestaurantsModel;

    const useCase = new GetOnboardingRecommendationUseCase(
      {
        findAllActiveRestaurants: jest.fn().mockResolvedValue([restaurant]),
        findByIds: jest.fn().mockResolvedValue([restaurant]),
      } as never,
      { findAllReviews: jest.fn().mockResolvedValue([]) } as never,
      {
        findUserPreferencesByUserId: jest.fn().mockResolvedValue(null),
      } as never,
      {
        execute: jest.fn().mockResolvedValue({ restaurants: [] }),
      } as never,
    );

    const result = await useCase.execute('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'restaurant-2',
      name: 'Restaurante B',
    });
  });
});
