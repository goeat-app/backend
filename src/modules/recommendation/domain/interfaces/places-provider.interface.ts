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
  imageUrl?: string;
  editorialSummary?: string;
  editorialSummarySource?: 'google' | 'generated';
}

export abstract class PlacesProvider {
  abstract searchNearby(
    input: NearbySearchInput,
  ): Promise<RestaurantCandidate[]>;

  abstract getPlaceDetails(providerPlaceId: string): Promise<RestaurantDetails>;
}
