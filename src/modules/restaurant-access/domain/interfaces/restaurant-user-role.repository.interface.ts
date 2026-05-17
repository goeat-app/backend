import { RestaurantRole } from '../enums/restaurant-role.enum';

export type RestaurantUserRoleRecord = {
  id: string;
  restaurantId: string;
  userId: string;
  role: RestaurantRole;
  createdAt: Date;
  updatedAt: Date;
};

export type RestaurantMembershipRestaurantRecord = {
  id: string;
  name: string;
  averagePrice: number;
  averageRating: number;
  totalReviews: number;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  placeType?: {
    id: string;
    name: string;
    slug: string;
  };
  foodType?: {
    id: string;
    name: string;
    slug: string;
  };
};

export type RestaurantWithRoleRecord = {
  id: string;
  restaurantId: string;
  userId: string;
  role: RestaurantRole;
  createdAt: Date;
  updatedAt: Date;
  restaurant: RestaurantMembershipRestaurantRecord;
};

export abstract class IRestaurantUserRoleRepository {
  abstract findByUserAndRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord | null>;

  abstract listByRestaurant(
    restaurantId: string,
  ): Promise<RestaurantUserRoleRecord[]>;

  abstract listByUser(userId: string): Promise<RestaurantWithRoleRecord[]>;

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
