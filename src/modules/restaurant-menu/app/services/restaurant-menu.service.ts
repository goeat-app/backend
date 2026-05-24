import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { MenuCategoryModel } from '../../infra/database/menu-category.model';
import { MenuItemModel } from '../../infra/database/menu-item.model';
import { UpdateMenuCategoryType } from '../../dtos/update-menu-category.dto';
import { UpdateMenuItemType } from '../../dtos/update-menu-item.dto';
import { UpdateMenuItemAvailabilityType } from '../../dtos/update-menu-item-availability.dto';

@Injectable()
export class RestaurantMenuService {
  constructor(
    @InjectModel(MenuCategoryModel)
    private readonly menuCategoryModel: typeof MenuCategoryModel,
    @InjectModel(MenuItemModel)
    private readonly menuItemModel: typeof MenuItemModel,
  ) {}

  async updateCategory(params: {
    restaurantId: string;
    categoryId: string;
    body: UpdateMenuCategoryType;
  }): Promise<MenuCategoryModel> {
    const category = await this.menuCategoryModel.findOne({
      where: {
        id: params.categoryId,
        restaurant_id: params.restaurantId,
        deleted_at: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    if (params.body.name !== undefined) {
      category.name = params.body.name;
    }

    if (params.body.slug !== undefined) {
      category.slug = params.body.slug;
    }

    if (params.body.sort_order !== undefined) {
      category.sort_order = params.body.sort_order;
    }

    try {
      await category.save();
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Menu category uniqueness conflict');
      }
      throw error;
    }

    return category;
  }

  async updateItem(params: {
    restaurantId: string;
    itemId: string;
    body: UpdateMenuItemType;
  }): Promise<MenuItemModel> {
    const item = await this.menuItemModel.findOne({
      where: {
        id: params.itemId,
        restaurant_id: params.restaurantId,
        deleted_at: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    const nextHasSizes = params.body.has_sizes ?? item.has_sizes;
    const nextBasePrice =
      params.body.base_price !== undefined
        ? params.body.base_price
        : item.base_price;

    if (
      nextHasSizes === false &&
      (nextBasePrice === null || nextBasePrice === undefined)
    ) {
      throw new BadRequestException('has_sizes=false requires base_price');
    }

    if (params.body.category_id !== undefined) {
      const category = await this.menuCategoryModel.findOne({
        where: {
          id: params.body.category_id,
          restaurant_id: params.restaurantId,
          deleted_at: null,
        },
      });

      if (!category) {
        throw new BadRequestException(
          'category_id must belong to the same restaurant',
        );
      }

      item.category_id = params.body.category_id;
    }

    if (params.body.description !== undefined) {
      item.description = params.body.description;
    }

    if (params.body.base_price !== undefined) {
      item.base_price = params.body.base_price;
    }

    if (params.body.has_sizes !== undefined) {
      item.has_sizes = params.body.has_sizes;
    }

    try {
      await item.save();
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Menu item uniqueness conflict');
      }
      throw error;
    }

    return item;
  }

  async updateItemAvailability(params: {
    restaurantId: string;
    itemId: string;
    body: UpdateMenuItemAvailabilityType;
  }): Promise<MenuItemModel> {
    const item = await this.menuItemModel.findOne({
      where: {
        id: params.itemId,
        restaurant_id: params.restaurantId,
        deleted_at: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.is_available = params.body.is_available;
    await item.save();

    return item;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof UniqueConstraintError) {
      return true;
    }

    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'SequelizeUniqueConstraintError'
    );
  }
}
