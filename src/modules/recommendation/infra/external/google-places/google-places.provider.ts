import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import {
  GooglePlace,
  GooglePlaceMapper,
} from '@/modules/recommendation/app/mappers/google-place.mapper';
import { PlacesProviderError } from '@/modules/recommendation/domain/errors/places-provider.error';
import {
  NearbySearchInput,
  PlacesProvider,
  RestaurantCandidate,
  RestaurantDetails,
} from '@/modules/recommendation/domain/interfaces/places-provider.interface';

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';
const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.primaryType',
  'places.types',
  'places.priceLevel',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.regularOpeningHours.periods',
  'places.regularOpeningHours.weekdayDescriptions',
].join(',');
const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'location',
  'primaryType',
  'types',
  'priceLevel',
  'rating',
  'userRatingCount',
  'businessStatus',
  'regularOpeningHours.periods',
  'regularOpeningHours.weekdayDescriptions',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'editorialSummary',
].join(',');

@Injectable()
export class GooglePlacesProvider extends PlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async searchNearby(input: NearbySearchInput): Promise<RestaurantCandidate[]> {
    const apiKey = this.getApiKey();

    try {
      const response = await axios.post<{ places: GooglePlace[] }>(
        `${GOOGLE_PLACES_BASE_URL}/places:searchNearby`,
        {
          includedTypes: input.includedTypes ?? ['restaurant'],
          maxResultCount: input.maxResultCount ?? 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: input.location.latitude,
                longitude: input.location.longitude,
              },
              radius: input.radiusMeters,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': NEARBY_FIELD_MASK,
          },
          timeout: 10000,
        },
      );

      return (response.data?.places ?? [])
        .map((place) => GooglePlaceMapper.toRestaurantCandidate(place))
        .filter((place): place is RestaurantCandidate => Boolean(place));
    } catch (error) {
      this.logger.warn(
        `Google Places nearby search failed: ${this.describeError(error)}`,
      );
      throw new PlacesProviderError(
        'Unable to fetch nearby restaurants',
        error,
      );
    }
  }

  async getPlaceDetails(providerPlaceId: string): Promise<RestaurantDetails> {
    const apiKey = this.getApiKey();

    try {
      const response = await axios.get<GooglePlace>(
        `${GOOGLE_PLACES_BASE_URL}/places/${providerPlaceId}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': DETAILS_FIELD_MASK,
          },
          timeout: 10000,
        },
      );
      const details = GooglePlaceMapper.toRestaurantDetails(response.data);

      if (!details) {
        throw new PlacesProviderError('Google place details were incomplete');
      }

      return details;
    } catch (error) {
      if (error instanceof PlacesProviderError) throw error;

      this.logger.warn(
        `Google Places details failed: ${this.describeError(error)}`,
      );
      throw new PlacesProviderError(
        'Unable to fetch restaurant details',
        error,
      );
    }
  }

  private getApiKey(): string {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new PlacesProviderError('GOOGLE_PLACES_API_KEY is not configured');
    }

    return apiKey;
  }

  private describeError(error: unknown): string {
    if (error instanceof AxiosError) {
      return `${error.response?.status ?? 'network'} ${JSON.stringify(
        error.response?.data ?? error.message,
      )}`;
    }

    return error instanceof Error ? error.message : 'unknown error';
  }
}
