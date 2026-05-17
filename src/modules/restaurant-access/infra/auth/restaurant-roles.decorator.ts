import { SetMetadata } from '@nestjs/common';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';

export const RESTAURANT_ROLES_KEY = 'restaurant_roles';
export const RestaurantRoles = (...roles: RestaurantRole[]) =>
  SetMetadata(RESTAURANT_ROLES_KEY, roles);
