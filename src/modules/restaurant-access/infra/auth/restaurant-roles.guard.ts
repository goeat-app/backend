import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RestaurantAccessService } from '../../app/services/restaurant-access.service';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';
import { RESTAURANT_ROLES_KEY } from './restaurant-roles.decorator';

type RequestWithUser = Request & {
  params: Record<string, string>;
  user?: {
    id?: string;
  };
};

@Injectable()
export class RestaurantRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RestaurantRole[]>(
      RESTAURANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;
    const restaurantId = request.params?.restaurantId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!restaurantId) {
      throw new BadRequestException('restaurantId route param is required');
    }

    return this.restaurantAccessService.hasAnyRole({
      userId,
      restaurantId,
      roles: requiredRoles,
    });
  }
}
