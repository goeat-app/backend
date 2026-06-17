import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type IncludeOptions } from 'sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { RestaurantQueryFilters } from '@/modules/recommendation/domain/types/restaurant-query-filters.type';

@Injectable()
export class RestaurantRepository implements IRestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

  private readonly defaultIncludes = [
    {
      model: PlaceTypeModel,
      attributes: ['id', 'name', 'slug'],
    },
    {
      model: FoodTypeModel,
      attributes: ['id', 'name', 'slug'],
    },
  ];

  async findAllActiveRestaurants(
    filters?: RestaurantQueryFilters,
  ): Promise<RestaurantsModel[]> {
    const where: Record<string, unknown> = { is_active: true };

    if (filters?.minRating) {
      where.average_rating = { [Op.gte]: filters.minRating };
    }

    if (filters?.minPrice !== undefined && filters?.maxPrice !== undefined) {
      where.average_price = {
        [Op.between]: [filters.minPrice, filters.maxPrice],
      };
    } else if (filters?.minPrice !== undefined) {
      where.average_price = { [Op.gte]: filters.minPrice };
    } else if (filters?.maxPrice !== undefined) {
      where.average_price = { [Op.lte]: filters.maxPrice };
    }

    const placeTypeInclude: IncludeOptions = {
      model: PlaceTypeModel,
      attributes: ['id', 'name', 'slug'],
    };
    if (filters?.restaurantStyles?.length) {
      placeTypeInclude.where = { name: { [Op.in]: filters.restaurantStyles } };
      placeTypeInclude.required = true;
    }

    const foodTypeInclude: IncludeOptions = {
      model: FoodTypeModel,
      attributes: ['id', 'name', 'slug'],
    };
    if (filters?.foodTypes?.length) {
      foodTypeInclude.where = { name: { [Op.in]: filters.foodTypes } };
      foodTypeInclude.required = true;
    }

    return await this.restaurantModel.findAll({
      where,
      include: [placeTypeInclude, foodTypeInclude],
      raw: false,
    });
  }

  async findByIds(ids: string[]): Promise<RestaurantsModel[]> {
    if (ids.length === 0) {
      return [];
    }

    return await this.restaurantModel.findAll({
      where: { id: { [Op.in]: ids } },
      include: this.defaultIncludes,
      raw: false,
    });
  }
}
