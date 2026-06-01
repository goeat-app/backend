import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { getPriceLevel } from '@/lib/helpers/get-price-level.helper';
import { RestaurantAccessService } from '../../app/services/restaurant-access.service';
import { RestaurantWithRoleResponseDto } from '../../dtos/restaurant-with-role-response.dto';

type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('restaurants')
export class MyRestaurantsController {
  constructor(
    private readonly restaurantAccessService: RestaurantAccessService,
  ) {}

  @Get('me')
  async listMyRestaurants(
    @Req() req: RequestWithUser,
  ): Promise<RestaurantWithRoleResponseDto[]> {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const memberships =
      await this.restaurantAccessService.listRestaurantsByUser({
        userId: req.user.id,
      });

    return memberships.map((membership) => ({
      id: membership.restaurant.id,
      role: membership.role,
      name: membership.restaurant.name,
      placeType: membership.restaurant.placeType?.name || 'Unknown',
      slug: membership.restaurant.placeType?.slug || '',
      foodType: membership.restaurant.foodType?.name || 'Unknown',
      priceLevel: getPriceLevel(membership.restaurant.averagePrice),
      avgRating: membership.restaurant.averageRating,
      address: membership.restaurant.address,
      city: membership.restaurant.city,
      state: membership.restaurant.state,
    }));
  }
}
