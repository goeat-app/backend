import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IFavoriteSavingsRepository } from '../../domain/interfaces/favorite-savings.interface';
import { FavoriteSavingsEntity } from '../../domain/entities/favorite-savings.entity';
import { FavoriteSavingsModel } from '../database/favorite-savings.model';

@Injectable()
export class SequelizeFavoriteSavingsRepository
  implements IFavoriteSavingsRepository
{
  constructor(
    @InjectModel(FavoriteSavingsModel)
    private readonly favoriteSavingsModel: typeof FavoriteSavingsModel,
  ) {}

  async findByUserId(userId: string): Promise<FavoriteSavingsEntity | null> {
    const data = await this.favoriteSavingsModel.findOne({
      where: { user_id: userId },
    });

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      restaurantIds: data.favorite_restaurant_ids,
    };
  }

  async saveFavoritesByUserId(
    userId: string,
    restaurantIds: string[],
  ): Promise<FavoriteSavingsEntity> {
    const [favoriteSavings] = await this.favoriteSavingsModel.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        favorite_restaurant_ids: [],
      },
    });

    favoriteSavings.favorite_restaurant_ids = restaurantIds;
    await favoriteSavings.save();

    return {
      userId: favoriteSavings.user_id,
      restaurantIds: favoriteSavings.favorite_restaurant_ids,
    };
  }

  async removeRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<FavoriteSavingsEntity | null> {
    const favoriteSavings = await this.favoriteSavingsModel.findOne({
      where: { user_id: userId },
    });

    if (!favoriteSavings) {
      return null;
    }

    favoriteSavings.favorite_restaurant_ids =
      favoriteSavings.favorite_restaurant_ids.filter((id) => id !== restaurantId);
    await favoriteSavings.save();

    return {
      userId: favoriteSavings.user_id,
      restaurantIds: favoriteSavings.favorite_restaurant_ids,
    };
  }
}
