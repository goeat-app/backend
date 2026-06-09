import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';

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

  async findAllActiveRestaurants(): Promise<RestaurantsModel[]> {
    return await this.restaurantModel.findAll({
      where: { is_active: true },
      include: this.defaultIncludes,
      raw: false,
    });
  }

  async findByIds(ids: string[]): Promise<RestaurantsModel[]> {
    return await this.restaurantModel.findAll({
      where: { id: ids },
      include: this.defaultIncludes,
      raw: false,
    });
  }
}
