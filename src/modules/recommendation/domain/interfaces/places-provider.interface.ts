import { Location } from '../value-objects/location';
import { RestaurantProvider } from '../enums/restaurant-provider.enum';

export interface NearbySearchInput {
  location: Location;
  radiusMeters: number;
  maxResultCount?: number;
  includedTypes?: string[];
}

export interface RestaurantCandidate {
  provider: RestaurantProvider;
  providerPlaceId: string;
  name: string;
  location: Location;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  types: string[];
  primaryType?: string;
  priceLevel?: number;
  rating?: number;
  ratingCount?: number;
  businessStatus?: string;
  openNow?: boolean;
}

export interface RestaurantDetails extends RestaurantCandidate {
  website?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    authorAttributionsNames: Array<string>;
  }>;
  editorialSummary?: string;
  editorialSummarySource?: 'google' | 'generated';
}

export interface EnrichedRestaurantDetails extends Omit<
  RestaurantDetails,
  'photos'
> {
  imagePath?: string;
}

export abstract class PlacesProvider {
  abstract searchNearby(input: NearbySearchInput): Promise<Array<string>>;

  abstract getPlaceDetails(providerPlaceId: string): Promise<RestaurantDetails>;

  abstract getAndSaveImageByName(
    path: string,
    name: string,
    imageName: string,
    widthPx?: number,
    heightPx?: number,
  ): Promise<string>;
}
