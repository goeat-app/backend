import { Injectable, Logger } from '@nestjs/common';
import { PlacesProvider } from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { Location } from '@/modules/recommendation/domain/value-objects/location';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';

interface SyncNearbyRestaurantsInput {
  location: Location;
  radiusMeters: number;
  maxResultCount?: number;
}

@Injectable()
export class RestaurantDiscoverySyncService {
  private readonly logger = new Logger(RestaurantDiscoverySyncService.name);

  constructor(
    private readonly placesProvider: PlacesProvider,
    private readonly restaurantRepository: IRestaurantRepository,
  ) {}

  async syncNearbyRestaurants(
    input: SyncNearbyRestaurantsInput,
  ): Promise<RestaurantsModel[]> {
    const candidates = await this.placesProvider.searchNearby({
      location: input.location,
      radiusMeters: input.radiusMeters,
      maxResultCount: input.maxResultCount,
      includedTypes: ['restaurant'],
    });

    this.logger.log(
      `Found ${candidates.length} nearby restaurants for location: ${input.location.latitude}, ${input.location.longitude}`,
    );

    if (!candidates.length) {
      return [];
    }

    return this.restaurantRepository.upsertDiscoveredRestaurants(candidates);
  }
}
