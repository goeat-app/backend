import { Injectable } from '@nestjs/common';
import { RestaurantDiscoverySyncService } from '../services/restaurant-discovery-sync.service';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';

interface SyncNearbyRestaurantsUseCaseInput {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  maxResultCount?: number;
}

@Injectable()
export class SyncNearbyRestaurantsUseCase {
  constructor(
    private readonly discoverySyncService: RestaurantDiscoverySyncService,
  ) {}

  async execute(
    input: SyncNearbyRestaurantsUseCaseInput,
  ): Promise<RestaurantsModel[]> {
    return this.discoverySyncService.syncNearbyRestaurants({
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      radiusMeters: input.radiusMeters,
      maxResultCount: input.maxResultCount,
    });
  }
}
