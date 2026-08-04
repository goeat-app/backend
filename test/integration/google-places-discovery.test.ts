import path from 'path';
import { ConfigService } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { RestaurantDiscoverySyncService } from '../../src/modules/recommendation/app/services/restaurant-discovery-sync.service';
import { GooglePlacesProvider } from '../../src/modules/recommendation/infra/external/google-places/google-places.provider';
import { RestaurantRepository } from '../../src/modules/recommendation/infra/repositories/restaurants/restaurants.repository';
import { RestaurantsModel } from '../../src/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '../../src/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '../../src/modules/profile-mapping/infra/database/food-type.model';
import { RestaurantProvider } from '../../src/modules/recommendation/domain/enums/restaurant-provider.enum';

dotenvConfig({ path: path.resolve(process.cwd(), '.env') });

const describeIfConfigured = process.env.GOOGLE_PLACES_API_KEY && process.env.DATABASE_URL
  ? describe
  : describe.skip;

describeIfConfigured('Google Places discovery integration', () => {
  it('calls Google Places and persists discovered restaurants into PostgreSQL', async () => {
    const sequelize = new Sequelize(process.env.DATABASE_URL!, {
      dialect: 'postgres',
      logging: false,
    }) as Sequelize & { addModels: (models: unknown[]) => void };

    sequelize.addModels([RestaurantsModel, PlaceTypeModel, FoodTypeModel]);

    const restaurantModel = sequelize.models.RestaurantsModel as typeof RestaurantsModel;
    const repository = new RestaurantRepository(restaurantModel);
    const provider = new GooglePlacesProvider(new ConfigService());
    const service = new RestaurantDiscoverySyncService(provider, repository);

    const insertedProviderPlaceIds: string[] = [];

    try {
      await sequelize.authenticate();

      const result = await service.syncNearbyRestaurants({
        location: { latitude: -23.55052, longitude: -46.633308 },
        radiusMeters: 3000,
        maxResultCount: 3,
      });

      expect(result.length).toBeGreaterThan(0);

      const googleResults = result.filter(
        (restaurant) => restaurant.provider === RestaurantProvider.GooglePlaces,
      );

      expect(googleResults.length).toBeGreaterThan(0);
      insertedProviderPlaceIds.push(
        ...googleResults
          .map((restaurant) => restaurant.provider_place_id)
          .filter((id): id is string => Boolean(id)),
      );

      const persisted = await restaurantModel.findAll({
        where: {
          provider_place_id: googleResults.map(
            (restaurant) => restaurant.provider_place_id,
          ),
        },
      });

      expect(persisted.length).toBeGreaterThan(0);

      const firstPersisted = persisted.find(
        (restaurant) => restaurant.provider_place_id === googleResults[0].provider_place_id,
      );

      expect(firstPersisted?.name).toBe(googleResults[0].name);
      expect(firstPersisted?.provider).toBe(RestaurantProvider.GooglePlaces);
    } finally {
      if (insertedProviderPlaceIds.length > 0) {
        await restaurantModel.destroy({
          where: {
            provider_place_id: insertedProviderPlaceIds,
          },
        });
      }

      await sequelize.close();
    }
  });
});
