import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RestaurantQueryFilters } from '../../types/restaurant-query-filters.type';

export abstract class IRestaurantRepository {
  abstract findAllActiveRestaurants(
    filters?: RestaurantQueryFilters,
  ): Promise<RestaurantsModel[]>;
  abstract findByIds(ids: string[]): Promise<RestaurantsModel[]>;
}
