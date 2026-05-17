import { RestaurantRole } from '../enums/restaurant-role.enum';

export type RestaurantUserRoleRecord = {
  id: string;
  restaurantId: string;
  userId: string;
  role: RestaurantRole;
  createdAt: Date;
  updatedAt: Date;
};

export abstract class IRestaurantUserRoleRepository {
  abstract findByUserAndRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord | null>;

  abstract listByRestaurant(
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord[]>;

  abstract assignOrUpdateRole(params: {
    restaurantId: string;
    userId: string;
    role: RestaurantRole;
  }): Promise<RestaurantUserRoleRecord>;

  abstract removeRole(params: {
    restaurantId: string;
    userId: string;
  }): Promise<void>;

  abstract countOwners(restaurantId: string): Promise<number>;

  abstract countByRestaurant(restaurantId: string): Promise<number>;
}
