import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import pLimit from 'p-limit';
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
  private readonly imageOperationLimiter = pLimit(5);

  constructor(
    private readonly placesProvider: PlacesProvider,
    private readonly restaurantRepository: IRestaurantRepository,
  ) {}

  async syncNearbyRestaurants(
    input: SyncNearbyRestaurantsInput,
  ): Promise<RestaurantsModel[]> {
    this.logger.log(
      `Starting nearby restaurant discovery (lat=${input.location.latitude}, lng=${input.location.longitude}, radius=${input.radiusMeters}m).`,
    );
    const discoveredCandidates = await this.placesProvider.searchNearby({
      location: input.location,
      radiusMeters: input.radiusMeters,
      maxResultCount: input.maxResultCount,
      includedTypes: ['restaurant'],
    });

    console.log(
      `Nearby discovery returned ${discoveredCandidates.length} candidates (lat=${input.location.latitude}, lng=${input.location.longitude}, radius=${input.radiusMeters}m).`,
    );

    const nearbyResults = discoveredCandidates as Array<
      string | RestaurantCandidate
    >;

    this.logger.log(
      `Nearby discovery returned ${nearbyResults.length} candidates (lat=${input.location.latitude}, lng=${input.location.longitude}, radius=${input.radiusMeters}m).`,
    );

    if (!nearbyResults.length) {
      return [];
    }

    const placeIds = nearbyResults.map((result) =>
      typeof result === 'string' ? result : result.providerPlaceId,
    );

    let existingRestaurants: RestaurantsModel[] = [];
    let existingPlaceIds = new Set<string>();

    if (
      typeof this.restaurantRepository.findByProviderPlaceIds === 'function'
    ) {
      existingRestaurants =
        await this.restaurantRepository.findByProviderPlaceIds(
          placeIds,
          'google_places',
        );

      existingPlaceIds = new Set(
        existingRestaurants
          .map((restaurant) => restaurant.provider_place_id)
          .filter((id): id is string => Boolean(id)),
      );
    }

    const newPlaceIds = nearbyResults.filter(
      (result) =>
        !existingPlaceIds.has(
          typeof result === 'string' ? result : result.providerPlaceId,
        ),
    );

    this.logger.log(
      `Found ${existingRestaurants.length} existing restaurants, enriching ${newPlaceIds.length} new ones.`,
    );

    const restaurantDetails = await this.enrichWithDetails(newPlaceIds);
    const restaurantDetailsByPlaceId = new Map(
      restaurantDetails.map((detail) => [detail.providerPlaceId, detail]),
    );

    const newRestaurants =
      await this.restaurantRepository.upsertDiscoveredRestaurants(
        restaurantDetails,
      );

    const updatedRestaurants = await this.getNewRestaurantsUpdated(
      newRestaurants,
      restaurantDetailsByPlaceId,
    );

    const updatedExistingRestaurants =
      await this.syncExistingRestaurantsImage(existingRestaurants);

    // Return both existing and newly created restaurants
    return [...updatedExistingRestaurants, ...updatedRestaurants];
  }

  private async getNewRestaurantsUpdated(
    newRestaurants: RestaurantsModel[],
    restaurantDetailsByPlaceId: Map<string, RestaurantDetails>,
  ): Promise<RestaurantsModel[]> {
    // Process images only for newly created restaurants
    const updatedRestaurants = await Promise.all(
      newRestaurants.map((restaurant) =>
        this.imageOperationLimiter(async () => {
          const details = restaurant.provider_place_id
            ? restaurantDetailsByPlaceId.get(restaurant.provider_place_id)
            : undefined;

          if (!details?.photos?.length) {
            return restaurant;
          }

          const selectedPhoto =
            details.photos.find((photo) =>
              photo.authorAttributionsNames.includes(details.name),
            ) ?? details.photos[0];

          try {
            const storedImagePath =
              await this.placesProvider.getAndSaveImageByName(
                `restaurants/${restaurant.id}/pictures`,
                `${randomUUID()}`,
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
          } catch (error) {
            this.logger.error(
              `Failed to store image for restaurant ${restaurant.id}. Error: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
          }

          return restaurant;
        }),
      ),
    );
    return updatedRestaurants;
  }

  private async syncExistingRestaurantsImage(
    existingRestaurants: RestaurantsModel[],
  ): Promise<RestaurantsModel[]> {
    const toSyncRestaurants = existingRestaurants
      .filter((restaurant) => !restaurant.image_url)
      .map((restaurant) => restaurant.provider_place_id)
      .filter((id): id is string => Boolean(id));

    const restaurantDetails = await this.enrichWithDetails(toSyncRestaurants);
    const restaurantDetailsByPlaceId = new Map(
      restaurantDetails.map((detail) => [detail.providerPlaceId, detail]),
    );

    const updatedRestaurants = await Promise.all(
      existingRestaurants.map((restaurant) =>
        this.imageOperationLimiter(async () => {
          if (restaurant.image_url) {
            return restaurant;
          }

          const details = restaurant.provider_place_id
            ? restaurantDetailsByPlaceId.get(restaurant.provider_place_id)
            : undefined;

          if (!details) {
            this.logger.warn(
              `No details found for existing restaurant ${restaurant.id} with provider place ID ${restaurant.provider_place_id}.`,
            );
            return restaurant;
          }

          const selectedPhoto =
            details.photos?.find((photo) =>
              photo.authorAttributionsNames.includes(details.name),
            ) ?? details.photos?.[0];

          if (!selectedPhoto) {
            this.logger.warn(
              `No photos found for existing restaurant ${restaurant.id} with provider place ID ${restaurant.provider_place_id}.`,
            );
            return restaurant;
          }

          try {
            const storedImagePath =
              await this.placesProvider.getAndSaveImageByName(
                `restaurants/${restaurant.id}/pictures`,
                `${randomUUID()}`,
                selectedPhoto.name,
                selectedPhoto.widthPx,
              );

            console.log(
              `Stored image for existing restaurant ${restaurant.id} at path: ${storedImagePath}`,
            );
            const updatedRestaurant =
              await this.restaurantRepository.updateRestaurantDetails(
                restaurant.id,
                {
                  image_url: storedImagePath,
                },
              );

            console.log(
              `Updated existing restaurant ${restaurant.id} with image URL: ${updatedRestaurant.image_url}`,
            );

            return updatedRestaurant;
          } catch (error) {
            this.logger.error(
              `Failed to store image for existing restaurant ${restaurant.id}. Error: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
          }

          return restaurant;
        }),
      ),
    );
    return updatedRestaurants;
  }

  private async enrichWithDetails(
    candidates: Array<string | RestaurantCandidate>,
  ): Promise<Array<RestaurantDetails>> {
    const detailedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const placeId =
          typeof candidate === 'string' ? candidate : candidate.providerPlaceId;

        try {
          const placeDetails =
            await this.placesProvider.getPlaceDetails(placeId);

          return placeDetails;
        } catch (error) {
          this.logger.warn(
            `Failed to fetch details for ${placeId}; using nearby data. Error: ${error instanceof Error ? error.message : 'unknown error'}`,
          );

          if (typeof candidate === 'string') {
            return {
              providerPlaceId: placeId,
              name: placeId,
              location: { latitude: 0, longitude: 0 },
              types: ['restaurant'],
              provider: 'google_places' as never,
            } as RestaurantDetails;
          }

          return { ...candidate } as RestaurantDetails;
        }
      }),
    );

    return detailedCandidates.filter(
      (candidate): candidate is RestaurantDetails => Boolean(candidate),
    );
  }
}
