import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantsModel } from '../database/restaurant.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';

@Injectable()
export class RestaurantRepository {
  constructor(
    @InjectModel(RestaurantsModel)
    private readonly restaurantModel: typeof RestaurantsModel,
  ) {}

  async findAllActiveRestaurants() {
    return await this.restaurantModel.findAll({
      where: { is_active: 1 },
      include: [
        {
          model: PlaceTypeModel,
          attributes: ['id', 'name', 'tag_image'],
        },
        {
          model: FoodTypeModel,
          attributes: ['id', 'name', 'tag_image'],
        },
      ],
      raw: false,
    });
  }

  async findByIds(ids: string[]) {
    return await this.restaurantModel.findAll({
      where: { id: ids },
      include: [
        {
          model: PlaceTypeModel,
          attributes: ['id', 'name', 'tag_image'],
        },
        {
          model: FoodTypeModel,
          attributes: ['id', 'name', 'tag_image'],
        },
      ],
      raw: false,
    });
  }
}


