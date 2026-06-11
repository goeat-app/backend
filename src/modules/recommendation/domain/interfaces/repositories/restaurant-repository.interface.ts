import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';

export abstract class IRestaurantRepository {
  abstract findAllActiveRestaurants(): Promise<RestaurantsModel[]>;
  abstract findByIds(ids: string[]): Promise<RestaurantsModel[]>;
}
