import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { RestaurantRole } from '@/modules/restaurant-access/domain/enums/restaurant-role.enum';
import { RestaurantRoles } from '@/modules/restaurant-access/infra/auth/restaurant-roles.decorator';
import { RestaurantRolesGuard } from '@/modules/restaurant-access/infra/auth/restaurant-roles.guard';
import { RestaurantMenuService } from '../../app/services/restaurant-menu.service';
import { CreateMenuCategoryDto } from '../../dtos/create-menu-category.dto';
import { CreateMenuItemDto } from '../../dtos/create-menu-item.dto';
import { ListMenuCategoriesQueryDto } from '../../dtos/list-menu-categories-query.dto';
import { ListMenuItemsQueryDto } from '../../dtos/list-menu-items-query.dto';
import { ListMenuOverviewQueryDto } from '../../dtos/list-menu-overview-query.dto';
import { ReorderMenuCategoriesDto } from '../../dtos/reorder-menu-categories.dto';
import { ReorderMenuItemsDto } from '../../dtos/reorder-menu-items.dto';
import { UpdateMenuCategoryDto } from '../../dtos/update-menu-category.dto';
import { UpdateMenuItemDto } from '../../dtos/update-menu-item.dto';
import { UpdateMenuItemAvailabilityDto } from '../../dtos/update-menu-item-availability.dto';

@UseGuards(JwtAuthGuard, RestaurantRolesGuard)
@Controller('restaurants/:restaurantId/menu')
export class RestaurantMenuController {
  constructor(private readonly restaurantMenuService: RestaurantMenuService) {}

  @Get()
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async getOverview(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListMenuOverviewQueryDto,
  ) {
    return this.restaurantMenuService.getOverview({
      restaurantId,
      query,
    });
  }

  @Get('categories')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async listCategories(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListMenuCategoriesQueryDto,
  ) {
    return this.restaurantMenuService.listCategories({
      restaurantId,
      query,
    });
  }

  @Post('categories')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() body: CreateMenuCategoryDto,
  ) {
    return this.restaurantMenuService.createCategory({
      restaurantId,
      body,
    });
  }

  @Get('categories/:categoryId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async getCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.restaurantMenuService.getCategory({
      restaurantId,
      categoryId,
    });
  }

  @Patch('categories/reorder')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async reorderCategories(
    @Param('restaurantId') restaurantId: string,
    @Body() body: ReorderMenuCategoriesDto,
  ) {
    return this.restaurantMenuService.reorderCategories({
      restaurantId,
      orderedIds: body.ordered_ids,
    });
  }

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

  @Delete('categories/:categoryId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async deleteCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('categoryId') categoryId: string,
  ) {
    await this.restaurantMenuService.deleteCategory({
      restaurantId,
      categoryId,
    });

    return { success: true };
  }

  @Get('items')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async listItems(
    @Param('restaurantId') restaurantId: string,
    @Query() query: ListMenuItemsQueryDto,
  ) {
    return this.restaurantMenuService.listItems({
      restaurantId,
      query,
    });
  }

  @Post('items')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async createItem(
    @Param('restaurantId') restaurantId: string,
    @Body() body: CreateMenuItemDto,
  ) {
    return this.restaurantMenuService.createItem({
      restaurantId,
      body,
    });
  }

  @Patch('items/reorder')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async reorderItems(
    @Param('restaurantId') restaurantId: string,
    @Body() body: ReorderMenuItemsDto,
  ) {
    return this.restaurantMenuService.reorderItems({
      restaurantId,
      orderedIds: body.ordered_ids,
      categoryId: body.category_id,
    });
  }

  @Get('items/:itemId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async getItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.restaurantMenuService.getItem({
      restaurantId,
      itemId,
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

  @Delete('items/:itemId')
  @RestaurantRoles(RestaurantRole.OWNER, RestaurantRole.MANAGER)
  async deleteItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.restaurantMenuService.deleteItem({
      restaurantId,
      itemId,
    });

    return { success: true };
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
