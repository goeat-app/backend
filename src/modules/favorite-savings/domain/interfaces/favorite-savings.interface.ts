import { FavoriteSavingsEntity } from '../entities/favorite-savings.entity';

export abstract class IFavoriteSavingsRepository {
  abstract findByUserId(userId: string): Promise<FavoriteSavingsEntity | null>;
  abstract saveFavoritesByUserId(
    userId: string,
    restaurantIds: string[],
  ): Promise<FavoriteSavingsEntity>;

  abstract removeRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<FavoriteSavingsEntity | null>;
}
