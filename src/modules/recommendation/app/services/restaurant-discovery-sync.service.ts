import { Injectable, Logger } from '@nestjs/common';
import {
  PlacesProvider,
  RestaurantCandidate,
  RestaurantDetails,
} from '@/modules/recommendation/domain/interfaces/places-provider.interface';
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
      `Nearby discovery returned ${candidates.length} candidates (lat=${input.location.latitude}, lng=${input.location.longitude}, radius=${input.radiusMeters}m).`,
    );

    if (candidates.length) {
      const sample = candidates.slice(0, 3).map((candidate) => ({
        provider: candidate.provider,
        providerPlaceId: candidate.providerPlaceId,
        name: candidate.name,
        address: candidate.address,
        location: candidate.location,
        city: candidate.city,
        state: candidate.state,
        postalCode: candidate.postalCode,
        primaryType: candidate.primaryType,
        types: candidate.types,
        priceLevel: candidate.priceLevel,
        rating: candidate.rating,
        ratingCount: candidate.ratingCount,
        businessStatus: candidate.businessStatus,
        openNow: candidate.openNow,
      }));

      this.logger.log(
        `Nearby candidate fields sample: ${JSON.stringify(sample)}`,
      );
    }

    if (!candidates.length) {
      return [];
    }

    const enrichedCandidates = await this.enrichWithDetails(candidates);

    return this.restaurantRepository.upsertDiscoveredRestaurants(
      enrichedCandidates,
    );
  }

  private async enrichWithDetails(
    candidates: RestaurantCandidate[],
  ): Promise<Array<RestaurantCandidate | RestaurantDetails>> {
    const detailedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          return await this.placesProvider.getPlaceDetails(
            candidate.providerPlaceId,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to fetch details for ${candidate.providerPlaceId}; using nearby data. Error: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
          return candidate;
        }
      }),
    );

    return detailedCandidates;
  }
}
