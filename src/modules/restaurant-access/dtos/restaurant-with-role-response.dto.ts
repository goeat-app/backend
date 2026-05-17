import { RestaurantRole } from '../domain/enums/restaurant-role.enum';

export class RestaurantWithRoleResponseDto {
  id!: string;
  role!: RestaurantRole;
  name!: string;
  placeType!: string;
  slug!: string;
  foodType!: string;
  priceLevel!: number;
  avgRating!: number;
  address!: string;
  city!: string;
  state!: string;
}
