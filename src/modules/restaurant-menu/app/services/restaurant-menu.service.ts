import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError } from 'sequelize';
import { CreateMenuCategoryType } from '../../dtos/create-menu-category.dto';
import { CreateMenuItemType } from '../../dtos/create-menu-item.dto';
import { ListMenuCategoriesQueryType } from '../../dtos/list-menu-categories-query.dto';
import { ListMenuItemsQueryType } from '../../dtos/list-menu-items-query.dto';
import { ListMenuOverviewQueryType } from '../../dtos/list-menu-overview-query.dto';
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

  async getOverview(params: {
    restaurantId: string;
    query: ListMenuOverviewQueryType;
  }): Promise<{ categories: MenuCategoryModel[]; items: MenuItemModel[] }> {
    const [categories, items] = await Promise.all([
      this.listCategories({
        restaurantId: params.restaurantId,
        query: { search: params.query.search },
      }),
      this.listItems({
        restaurantId: params.restaurantId,
        query: {
          search: params.query.search,
          category_id: params.query.category_id,
          availability: params.query.availability,
        },
      }),
    ]);

    return {
      categories,
      items,
    };
  }

  async listCategories(params: {
    restaurantId: string;
    query: ListMenuCategoriesQueryType;
  }): Promise<MenuCategoryModel[]> {
    const where: Record<string, unknown> = {
      restaurant_id: params.restaurantId,
      deleted_at: null,
    };

    if (params.query.search) {
      (where as Record<PropertyKey, unknown>)[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${params.query.search}%`,
          },
        },
        {
          slug: {
            [Op.iLike]: `%${params.query.search}%`,
          },
        },
      ];
    }

    return this.menuCategoryModel.findAll({
      where,
      order: [['sort_order', 'ASC']],
    });
  }

  async createCategory(params: {
    restaurantId: string;
    body: CreateMenuCategoryType;
  }): Promise<MenuCategoryModel> {
    const category = this.menuCategoryModel.build({
      restaurant_id: params.restaurantId,
      name: params.body.name.trim(),
      slug: (params.body.slug ?? this.slugify(params.body.name)).trim(),
      sort_order:
        params.body.sort_order ??
        (await this.getNextCategorySortOrder(params.restaurantId)),
      is_active: true,
      deleted_at: null,
    });

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

  async getCategory(params: {
    restaurantId: string;
    categoryId: string;
  }): Promise<MenuCategoryModel> {
    return this.requireCategory(params.restaurantId, params.categoryId);
  }

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
      category.name = params.body.name.trim();
    }

    if (params.body.slug !== undefined) {
      category.slug = params.body.slug.trim();
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

  async reorderCategories(params: {
    restaurantId: string;
    orderedIds: string[];
  }): Promise<MenuCategoryModel[]> {
    const categories = await this.listCategories({
      restaurantId: params.restaurantId,
      query: {},
    });

    const knownIds = new Set(categories.map((category) => category.id));
    const hasUnknownId = params.orderedIds.some((id) => !knownIds.has(id));

    if (hasUnknownId) {
      throw new BadRequestException('Invalid category order payload');
    }

    for (const [index, id] of params.orderedIds.entries()) {
      await this.menuCategoryModel.update(
        { sort_order: index },
        {
          where: {
            id,
            restaurant_id: params.restaurantId,
            deleted_at: null,
          },
        },
      );
    }

    return this.listCategories({
      restaurantId: params.restaurantId,
      query: {},
    });
  }

  async deleteCategory(params: {
    restaurantId: string;
    categoryId: string;
  }): Promise<void> {
    await this.requireCategory(params.restaurantId, params.categoryId);

    const now = new Date();

    await this.menuCategoryModel.update(
      {
        deleted_at: now,
        is_active: false,
      },
      {
        where: {
          id: params.categoryId,
          restaurant_id: params.restaurantId,
          deleted_at: null,
        },
      },
    );

    await this.menuItemModel.update(
      {
        deleted_at: now,
        is_available: false,
      },
      {
        where: {
          restaurant_id: params.restaurantId,
          category_id: params.categoryId,
          deleted_at: null,
        },
      },
    );
  }

  async listItems(params: {
    restaurantId: string;
    query: ListMenuItemsQueryType;
  }): Promise<MenuItemModel[]> {
    const where: Record<string, unknown> = {
      restaurant_id: params.restaurantId,
      deleted_at: null,
    };

    if (params.query.category_id) {
      where['category_id'] = params.query.category_id;
    }

    if (params.query.availability === 'available') {
      where['is_available'] = true;
    }

    if (params.query.availability === 'unavailable') {
      where['is_available'] = false;
    }

    if (params.query.search) {
      (where as Record<PropertyKey, unknown>)[Op.or] = [
        {
          name: {
            [Op.iLike]: `%${params.query.search}%`,
          },
        },
        {
          description: {
            [Op.iLike]: `%${params.query.search}%`,
          },
        },
      ];
    }

    return this.menuItemModel.findAll({
      where,
      order: [['sort_order', 'ASC']],
    });
  }

  async createItem(params: {
    restaurantId: string;
    body: CreateMenuItemType;
  }): Promise<MenuItemModel> {
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

    const hasSizes = params.body.has_sizes ?? false;
    const basePrice = params.body.base_price ?? null;
    this.assertPriceRule(hasSizes, basePrice);

    const item = this.menuItemModel.build({
      restaurant_id: params.restaurantId,
      category_id: params.body.category_id,
      name: params.body.name.trim(),
      description: params.body.description ?? null,
      base_price: basePrice,
      has_sizes: hasSizes,
      is_available: params.body.is_available ?? true,
      sort_order:
        params.body.sort_order ??
        (await this.getNextItemSortOrder(
          params.restaurantId,
          params.body.category_id,
        )),
      image_key: null,
      deleted_at: null,
    });

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

  async getItem(params: {
    restaurantId: string;
    itemId: string;
  }): Promise<MenuItemModel> {
    return this.requireItem(params.restaurantId, params.itemId);
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

    this.assertPriceRule(nextHasSizes, nextBasePrice);

    const nextCategoryId = params.body.category_id ?? item.category_id;

    if (params.body.name !== undefined) {
      item.name = params.body.name.trim();
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

    if (params.body.is_available !== undefined) {
      item.is_available = params.body.is_available;
    }

    if (params.body.sort_order !== undefined) {
      item.sort_order = params.body.sort_order;
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

  async reorderItems(params: {
    restaurantId: string;
    orderedIds: string[];
    categoryId?: string;
  }): Promise<MenuItemModel[]> {
    const targetItems = await this.listItems({
      restaurantId: params.restaurantId,
      query: {
        category_id: params.categoryId,
      },
    });

    const knownIds = new Set(targetItems.map((item) => item.id));
    const hasUnknownId = params.orderedIds.some((id) => !knownIds.has(id));

    if (hasUnknownId) {
      throw new BadRequestException('Invalid item order payload');
    }

    for (const [index, id] of params.orderedIds.entries()) {
      await this.menuItemModel.update(
        { sort_order: index },
        {
          where: {
            id,
            restaurant_id: params.restaurantId,
            deleted_at: null,
          },
        },
      );
    }

    return this.listItems({
      restaurantId: params.restaurantId,
      query: {
        category_id: params.categoryId,
      },
    });
  }

  async deleteItem(params: {
    restaurantId: string;
    itemId: string;
  }): Promise<void> {
    await this.requireItem(params.restaurantId, params.itemId);

    await this.menuItemModel.update(
      {
        deleted_at: new Date(),
        is_available: false,
      },
      {
        where: {
          id: params.itemId,
          restaurant_id: params.restaurantId,
          deleted_at: null,
        },
      },
    );
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

  private async requireCategory(
    restaurantId: string,
    categoryId: string,
  ): Promise<MenuCategoryModel> {
    const category = await this.menuCategoryModel.findOne({
      where: {
        id: categoryId,
        restaurant_id: restaurantId,
        deleted_at: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Menu category not found');
    }

    return category;
  }

  private async requireItem(
    restaurantId: string,
    itemId: string,
  ): Promise<MenuItemModel> {
    const item = await this.menuItemModel.findOne({
      where: {
        id: itemId,
        restaurant_id: restaurantId,
        deleted_at: null,
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  private assertPriceRule(
    hasSizes: boolean,
    basePrice: number | null | undefined,
  ) {
    if (!hasSizes && (basePrice === null || basePrice === undefined)) {
      throw new BadRequestException('has_sizes=false requires base_price');
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async getNextCategorySortOrder(
    restaurantId: string,
  ): Promise<number> {
    const total = await this.menuCategoryModel.count({
      where: {
        restaurant_id: restaurantId,
        deleted_at: null,
      },
    });

    return total;
  }

  private async getNextItemSortOrder(
    restaurantId: string,
    categoryId: string,
  ): Promise<number> {
    const total = await this.menuItemModel.count({
      where: {
        restaurant_id: restaurantId,
        category_id: categoryId,
        deleted_at: null,
      },
    });

    return total;
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
