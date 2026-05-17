import { IsEnum } from 'class-validator';
import { RestaurantRole } from '../domain/enums/restaurant-role.enum';

export class UpsertRestaurantUserRoleDto {
  @IsEnum(RestaurantRole)
  role!: RestaurantRole;
}
