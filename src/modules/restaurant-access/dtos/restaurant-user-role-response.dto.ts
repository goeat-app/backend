import { RestaurantRole } from '../domain/enums/restaurant-role.enum';

export class RestaurantUserRoleResponseDto {
  id!: string;
  restaurantId!: string;
  userId!: string;
  role!: RestaurantRole;
  createdAt!: Date;
  updatedAt!: Date;
}
