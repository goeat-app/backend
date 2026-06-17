import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';

export abstract class IRestaurantRepository {
  abstract findById(id: string): Promise<RestaurantsModel | null>;
}
