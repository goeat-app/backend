import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type IncludeOptions } from 'sequelize';
import { RestaurantsModel } from '../database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { RecommendationFilters } from '../controllers/ia.controller';

@Injectable()
export class RestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

  async findAllActiveRestaurants(filters?: RecommendationFilters) {
    const where: Record<string, any> = { is_active: true };

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

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return await this.restaurantModel.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        {
          model: PlaceTypeModel,
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: FoodTypeModel,
          attributes: ['id', 'name', 'slug'],
        },
      ],
      raw: false,
    });
  }
}
