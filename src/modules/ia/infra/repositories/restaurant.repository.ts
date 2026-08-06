import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
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

    return await this.restaurantModel.findAll({
      where,
      raw: false,
    });
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return await this.restaurantModel.findAll({
      where: { id: { [Op.in]: ids } },
      raw: false,
    });
  }
}
