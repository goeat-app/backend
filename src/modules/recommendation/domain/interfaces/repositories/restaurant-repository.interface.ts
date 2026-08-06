import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RestaurantCandidate } from '../places-provider.interface';
import { Location } from '../../value-objects/location';
import { RestaurantQueryFilters } from '../../types/restaurant-query-filters.type';

export abstract class IRestaurantRepository {
  abstract findAllActiveRestaurants(
    filters?: RestaurantQueryFilters,
  ): Promise<RestaurantsModel[]>;
  abstract findByIds(ids: string[]): Promise<RestaurantsModel[]>;
  abstract findCachedNearby(input: {
    location: Location;
    radiusMeters: number;
  }): Promise<RestaurantsModel[]>;
  abstract upsertDiscoveredRestaurants(
    candidates: RestaurantCandidate[],
  ): Promise<RestaurantsModel[]>;
}
