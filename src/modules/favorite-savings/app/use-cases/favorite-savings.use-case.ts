import { Injectable } from '@nestjs/common';
import { getPriceLevel } from '@/lib/helpers/get-price-level.helper';
import { PlainRestaurant } from '@/modules/ia/domain/entities/recommendation.entity';
import { RestaurantRepository } from '@/modules/ia/infra/repositories/restaurant.repository';
import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';
import { FavoriteSavingsResponseDto } from '../../dtos/favorite-savings-response.dto';
import { IFavoriteSavingsRepository } from '../../domain/interfaces/favorite-savings.interface';
import { SaveFavoriteSavingsDto } from '../../dtos/save-favorite-savings.dto';

@Injectable()
export class FavoriteSavingsUseCase {
  constructor(
    private readonly favoriteSavingsRepository: IFavoriteSavingsRepository,
    private readonly restaurantRepository: RestaurantRepository,
  ) {}

  async getByUserId(userId: string): Promise<FavoriteSavingsResponseDto> {
    const data = await this.favoriteSavingsRepository.findByUserId(userId);

    if (!data) {
      return {
        userId,
        restaurantIds: [],
        restaurants: [],
      };
    }

    return this.buildResponse(data.userId, data.restaurantIds);
  }

  async save(
    favoriteSavings: SaveFavoriteSavingsDto,
  ): Promise<FavoriteSavingsResponseDto> {
    const data = await this.favoriteSavingsRepository.saveFavoritesByUserId(
      favoriteSavings.userId,
      favoriteSavings.restaurantIds,
    );

    return this.buildResponse(data.userId, data.restaurantIds);
  }

  async removeRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<FavoriteSavingsResponseDto> {
    const data = await this.favoriteSavingsRepository.removeRestaurant(
      userId,
      restaurantId,
    );

    if (!data) {
      return {
        userId,
        restaurantIds: [],
        restaurants: [],
      };
    }

    return this.buildResponse(data.userId, data.restaurantIds);
  }

  private async buildResponse(
    userId: string,
    restaurantIds: string[],
  ): Promise<FavoriteSavingsResponseDto> {
    if (restaurantIds.length === 0) {
      return {
        userId,
        restaurantIds: [],
        restaurants: [],
      };
    }

    const rows = await this.restaurantRepository.findByIds(restaurantIds);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = restaurantIds
      .map((id) => byId.get(id))
      .filter((r): r is RestaurantsModel => r != null);

    return {
      userId,
      restaurantIds,
      restaurants: ordered.map((r) => this.mapRestaurant(r)),
    };
  }

  private mapRestaurant(restaurant: RestaurantsModel) {
    const plain = restaurant.get({ plain: true }) as PlainRestaurant;
    return {
      id: plain.id,
      name: plain.name,
      placeType: plain.placeType?.name ?? 'Unknown',
      slug: plain.placeType?.slug ?? '',
      foodType: plain.foodType?.name ?? 'Unknown',
      priceLevel: getPriceLevel(Number(plain.average_price)),
      avgRating: Number(plain.average_rating),
      address: plain.address,
      city: plain.city,
      state: plain.state,
    };
  }
}
