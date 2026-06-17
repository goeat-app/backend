import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { IRestaurantRepository } from './interfaces/restaurant-repository.interface';

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

  async findById(ids: string): Promise<RestaurantsModel | null> {
    return await this.restaurantModel.findOne({
      where: { id: ids },
      include: this.defaultIncludes,
      raw: false,
    });
  }
}
