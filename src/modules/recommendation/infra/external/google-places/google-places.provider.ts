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
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { FIREBASE_STORAGE_CONFIG } from '@/lib/infra/firebase/storage-config';

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';
const NEARBY_FIELD_MASK = ['places.id'].join(',');
const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'location',
  'addressComponents',
  'primaryType',
  'types',
  'priceLevel',
  'rating',
  'userRatingCount',
  'businessStatus',
  'currentOpeningHours.openNow',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'editorialSummary',
  'generativeSummary.overview.text',
  'photos.name',
  'photos.widthPx',
  'photos.authorAttributions.displayName',
].join(',');

@Injectable()
export class GooglePlacesProvider extends PlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: IStorageService,
  ) {
    super();
  }

  async searchNearby(input: NearbySearchInput): Promise<Array<string>> {
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
        .map((place) => place.id)
        .filter((placeId): placeId is string => Boolean(placeId));
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
      const details = GooglePlaceMapper.toRestaurantDetails(response.data, {
        googleApiKey: apiKey,
      });

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

  async getAndSaveImageByName(
    path: string,
    name: string,
    imageName: string,
    widthPx?: number,
    heightPx?: number,
  ): Promise<string> {
    const apiKey = this.getApiKey();

    try {
      const imageUrl = new URL(`${GOOGLE_PLACES_BASE_URL}/${imageName}/media`);
      imageUrl.searchParams.append('key', apiKey);

      if (!widthPx && !heightPx) {
        imageUrl.searchParams.append('maxWidthPx', '1080');
      }

      if (widthPx) {
        imageUrl.searchParams.append('maxWidthPx', widthPx.toString());
      }
      if (heightPx) {
        imageUrl.searchParams.append('maxHeightPx', heightPx.toString());
      }

      const response = await axios.get<ArrayBuffer>(imageUrl.toString(), {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const buffer = Buffer.from(response.data);
      const mimetype =
        (response.headers['content-type'] as string | undefined)
          ?.split(';')[0]
          ?.trim() ?? 'image/jpeg';
      const extension = mimetype.split('/')[1] ?? 'jpg';
      const completePath = `${path}/${name}.${extension}`;

      const bucketName =
        process.env.FIREBASE_STORAGE_BUCKET ??
        FIREBASE_STORAGE_CONFIG.DEFAULTS_BUCKET_NAME;

      const storedPath = await this.storageService.uploadFile(
        bucketName,
        completePath,
        buffer,
        mimetype,
      );

      return storedPath;
    } catch (error) {
      this.logger.warn(
        `Google Places image fetch failed: ${this.describeError(error)}`,
      );

      throw new PlacesProviderError(
        `Unable to fetch image for ${name} (${imageName})`,
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
