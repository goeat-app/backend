import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RestaurantImageModel } from '../database/restaurant-image.model';
import { IRestaurantImageRepository } from '../../domain/interfaces/restaurant-image.repository.interface';

@Injectable()
export class SequelizeRestaurantImageRepository implements IRestaurantImageRepository {
  constructor(
    @InjectModel(RestaurantImageModel)
    private readonly model: typeof RestaurantImageModel,
  ) {}

  async create(data: {
    restaurant_id: string;
    image_key: string;
    is_cover: boolean;
  }) {
    const record = await this.model.create({
      restaurant_id: data.restaurant_id,
      image_key: data.image_key,
      is_cover: data.is_cover,
    });

    return {
      id: record.id,
      restaurant_id: record.restaurant_id,
      image_key: record.image_key,
      is_cover: record.is_cover,
      created_at: record.created_at,
    };
  }

  async findByIdAndRestaurantId(imageId: string, restaurantId: string) {
    const record = await this.model.findOne({
      where: {
        id: imageId,
        restaurant_id: restaurantId,
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      restaurant_id: record.restaurant_id,
      image_key: record.image_key,
      is_cover: record.is_cover,
      created_at: record.created_at,
    };
  }

  async deleteById(imageId: string): Promise<void> {
    await this.model.destroy({
      where: { id: imageId },
    });
  }
}
