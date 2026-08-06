import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { IRestaurantRepository } from './interfaces/restaurant-repository.interface';

@Injectable()
export class RestaurantRepository implements IRestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

  async findById(ids: string): Promise<RestaurantsModel | null> {
    return await this.restaurantModel.findOne({
      where: { id: ids },
      raw: false,
    });
  }
}
