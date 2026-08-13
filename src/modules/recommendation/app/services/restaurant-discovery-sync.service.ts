import { Injectable, Logger } from '@nestjs/common';
import {
  PlacesProvider,
  RestaurantCandidate,
  RestaurantDetails,
} from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { IRestaurantRepository } from '@/modules/recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { Location } from '@/modules/recommendation/domain/value-objects/location';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { v4 } from 'uuid';
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
    const placeIds = await this.placesProvider.searchNearby({
      location: input.location,
      radiusMeters: input.radiusMeters,
      maxResultCount: input.maxResultCount,
      includedTypes: ['restaurant'],
    });

    this.logger.log(
      `Nearby discovery returned ${placeIds.length} candidates (lat=${input.location.latitude}, lng=${input.location.longitude}, radius=${input.radiusMeters}m).`,
    );

    if (!placeIds.length) {
      return [];
    }

    // Check database for existing restaurants with these provider place IDs
    const existingRestaurants =
      await this.restaurantRepository.findByProviderPlaceIds(
        placeIds,
        'google_places',
      );

    const existingPlaceIds = new Set(
      existingRestaurants.map((r) => r.provider_place_id),
    );

    // Only enrich restaurants that don't exist in the database
    const newPlaceIds = placeIds.filter((id) => !existingPlaceIds.has(id));

    this.logger.log(
      `Found ${existingRestaurants.length} existing restaurants, enriching ${newPlaceIds.length} new ones.`,
    );

    // Enrich only the new places
    const restaurantDetails = await this.enrichWithDetails(newPlaceIds);
    const candidatesFormatted: Array<{
      restaurantToInsert: RestaurantCandidate;
      photos?: Array<{
        name: string;
        widthPx: number;
        authorAttributionsNames: Array<string>;
      }>;
    }> = restaurantDetails.map((candidate) => ({
      restaurantToInsert: {
        providerPlaceId: candidate.providerPlaceId,
        name: candidate.name,
        address: candidate.address,
        location: candidate.location,
        types: candidate.types,
        provider: candidate.provider,
        primaryType: candidate.primaryType,
        priceLevel: candidate.priceLevel,
        rating: candidate.rating,
        ratingCount: candidate.ratingCount,
        businessStatus: candidate.businessStatus,
        openNow: candidate.openNow,
        city: candidate.city,
        state: candidate.state,
        postalCode: candidate.postalCode,
      },
      photos: candidate.photos,
    }));

    // Only upsert the new restaurants (existing ones don't need enrichment)
    const newRestaurants =
      await this.restaurantRepository.upsertDiscoveredRestaurants(
        candidatesFormatted.map((c) => c.restaurantToInsert),
      );

    // Process images only for newly created restaurants
    await Promise.all(
      newRestaurants.map(async (restaurant) => {
        const details = candidatesFormatted.find(
          (c) =>
            c.restaurantToInsert.providerPlaceId ===
            restaurant.provider_place_id,
        );

        if (!details?.photos?.length) {
          return restaurant;
        }

        const selectedPhoto =
          details.photos.find((photo) =>
            photo.authorAttributionsNames.includes(
              details.restaurantToInsert.name,
            ),
          ) ?? details.photos[0];

        const storedImagePath = await this.placesProvider.getAndSaveImageByName(
          `restaurants/${restaurant.id}/pictures`,
          `${v4()}`,
          selectedPhoto.name,
          selectedPhoto.widthPx,
        );

        console.log(
          `Stored image for restaurant ${restaurant.id} at path: ${storedImagePath}`,
        );
        const updatedRestaurant =
          await this.restaurantRepository.updateRestaurantDetails(
            restaurant.id,
            {
              image_url: storedImagePath,
            },
          );

        console.log(
          `Updated restaurant ${restaurant.id} with image URL: ${updatedRestaurant.image_url}`,
        );

        return updatedRestaurant;
      }),
    );

    // Return both existing and newly created restaurants
    return [...existingRestaurants, ...newRestaurants];
  }

  private async enrichWithDetails(
    candidates: string[],
  ): Promise<Array<RestaurantDetails>> {
    const detailedCandidates = await Promise.all(
      candidates.map(async (placeId) => {
        try {
          const placeDetails =
            await this.placesProvider.getPlaceDetails(placeId);

          return placeDetails;
        } catch (error) {
          this.logger.warn(
            `Failed to fetch details for ${placeId}; using nearby data. Error: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }),
    );

    return detailedCandidates.filter(
      (candidate): candidate is RestaurantDetails => Boolean(candidate),
    );
  }
}
