import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { RestaurantRole } from '@/modules/restaurant-access/domain/enums/restaurant-role.enum';
import { RestaurantRoles } from '@/modules/restaurant-access/infra/auth/restaurant-roles.decorator';
import { RestaurantRolesGuard } from '@/modules/restaurant-access/infra/auth/restaurant-roles.guard';
import { RestaurantMenuService } from '../../app/services/restaurant-menu.service';
import { UpdateMenuCategoryDto } from '../../dtos/update-menu-category.dto';
import { UpdateMenuItemDto } from '../../dtos/update-menu-item.dto';
import { UpdateMenuItemAvailabilityDto } from '../../dtos/update-menu-item-availability.dto';

@UseGuards(JwtAuthGuard, RestaurantRolesGuard)
@Controller('restaurants/:restaurantId/menu')
export class RestaurantMenuController {
  constructor(private readonly restaurantMenuService: RestaurantMenuService) {}

  @Patch('categories/:categoryId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async updateCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateMenuCategoryDto,
  ) {
    return this.restaurantMenuService.updateCategory({
      restaurantId,
      categoryId,
      body,
    });
  }

  @Patch('items/:itemId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async updateItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateMenuItemDto,
  ) {
    return this.restaurantMenuService.updateItem({
      restaurantId,
      itemId,
      body,
    });
  }

  @Patch('items/:itemId/availability')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async updateItemAvailability(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateMenuItemAvailabilityDto,
  ) {
    return this.restaurantMenuService.updateItemAvailability({
      restaurantId,
      itemId,
      body,
    });
  }
}
