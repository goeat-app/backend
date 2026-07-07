import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../dtos/response/restaurant-recommendation-response.dto';
import { RestaurantOnboardingMapper } from '../mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { IUserPreferenceRepository } from '../../domain/interfaces/repositories/user-preference-repository.interface';
import { IRestaurantRepository } from '../../domain/interfaces/repositories/restaurant-repository.interface';
import { UserPreferenceEntity } from '../../domain/entities/user-preference.entity';
import { RestaurantsModel } from '../../infra/database/restaurant.model';
import { PlainRestaurant } from '../mappers/types/map-onboarding-recommendation.types';
import { RestaurantDiscoverySyncService } from '../services/restaurant-discovery-sync.service';
import { PlacesProviderError } from '../../domain/errors/places-provider.error';

const DEFAULT_RADIUS_KM = 50;
const DEFAULT_GOOGLE_MAX_RESULT_COUNT = 20;
const MAX_PRICE_MARGIN = 1.15;

export type GetMapRestaurantsOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  city?: string;
};

@Injectable()
export class GetMapRestaurantsUseCase {
  constructor(
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly userPreferenceRepository: IUserPreferenceRepository,
    private readonly discoverySyncService: RestaurantDiscoverySyncService,
  ) {}

  async execute(
    userId: string,
    options: GetMapRestaurantsOptions = {},
  ): Promise<RestaurantRecommendationResponseDto[]> {
    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    await this.syncNearbyIfCoordinatesWereProvided(options);

    const restaurants =
      await this.restaurantRepository.findAllActiveRestaurants();

    const radiusKm = options.radiusKm ?? DEFAULT_RADIUS_KM;

    const filtered = restaurants.filter((restaurant) => {
      const plain = restaurant.get({ plain: true }) as PlainRestaurant;
      const placeType = plain['placeType'];
      const foodType = plain['foodType'];

      if (!this.hasValidCoordinates(restaurant)) return false;
      if (
        !this.matchesProfilePlain(
          placeType?.name ?? '',
          foodType?.name ?? '',
          preferences,
        )
      )
        return false;
      if (!this.matchesPrice(restaurant, preferences)) return false;
      if (
        options.city &&
        (restaurant.city ?? '').toLowerCase() !== options.city.toLowerCase()
      )
        return false;
      if (!this.isWithinRadius(restaurant, options, radiusKm)) return false;
      return true;
    });

    return RestaurantOnboardingMapper.toResponseDto(filtered);
  }

  private matchesProfilePlain(
    placeTypeName: string,
    foodTypeName: string,
    preferences: UserPreferenceEntity,
  ): boolean {
    const matchesPlaceType =
      preferences.preferredPlaceTypes.length === 0 ||
      preferences.preferredPlaceTypes.includes(placeTypeName);

    const matchesFoodType =
      preferences.preferredFoodTypes.length === 0 ||
      preferences.preferredFoodTypes.includes(foodTypeName);

    return matchesPlaceType || matchesFoodType;
  }

  private matchesPrice(
    restaurant: RestaurantsModel,
    preferences: UserPreferenceEntity,
  ): boolean {
    if (preferences.maxPrice == null) return true;

    const maxAllowed = Number(preferences.maxPrice) * MAX_PRICE_MARGIN;
    return Number(restaurant.average_price) <= maxAllowed;
  }

  private isWithinRadius(
    restaurant: RestaurantsModel,
    options: GetMapRestaurantsOptions,
    radiusKm: number,
  ): boolean {
    const { latitude, longitude } = options;

    if (latitude == null || longitude == null) return true;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return true;
    if (latitude === 0 && longitude === 0) return true;

    const distanceKm = this.getDistanceKm(
      latitude,
      longitude,
      Number(restaurant.latitude),
      Number(restaurant.longitude),
    );

    return distanceKm <= radiusKm;
  }

  private hasValidCoordinates(restaurant: RestaurantsModel): boolean {
    const latitude = Number(restaurant.latitude);
    const longitude = Number(restaurant.longitude);

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude !== 0 &&
      longitude !== 0
    );
  }

  private getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private async syncNearbyIfCoordinatesWereProvided(
    options: GetMapRestaurantsOptions,
  ): Promise<void> {
    const { latitude, longitude } = options;

    if (latitude == null || longitude == null) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (latitude === 0 && longitude === 0) return;

    try {
      await this.discoverySyncService.syncNearbyRestaurants({
        location: { latitude, longitude },
        radiusMeters: (options.radiusKm ?? DEFAULT_RADIUS_KM) * 1000,
        maxResultCount: DEFAULT_GOOGLE_MAX_RESULT_COUNT,
      });
    } catch (error) {
      if (error instanceof PlacesProviderError) return;
      throw error;
    }
  }
}
