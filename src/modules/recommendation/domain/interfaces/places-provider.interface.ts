import { RestaurantProvider } from '../enums/restaurant-provider.enum';
import { Location } from '../value-objects/location';

export interface NearbySearchInput {
  location: Location;
  radiusMeters: number;
  maxResultCount?: number;
  includedTypes?: string[];
}

export interface RestaurantOpeningHoursPeriodPoint {
  day?: number;
  hour?: number;
  minute?: number;
  date?: {
    year?: number;
    month?: number;
    day?: number;
  };
  truncated?: boolean;
}

export interface RestaurantOpeningHoursPeriod {
  open?: RestaurantOpeningHoursPeriodPoint;
  close?: RestaurantOpeningHoursPeriodPoint;
}

export interface RestaurantOpeningHours {
  periods?: RestaurantOpeningHoursPeriod[];
  weekdayDescriptions?: string[];
}

export interface RestaurantCandidate {
  provider: RestaurantProvider;
  providerPlaceId: string;
  name: string;
  location: Location;
  types: string[];
  primaryType?: string;
  priceLevel?: number;
  rating?: number;
  ratingCount?: number;
  businessStatus?: string;
  openingHours?: RestaurantOpeningHours;
}

export interface RestaurantDetails extends RestaurantCandidate {
  website?: string;
  phone?: string;
  editorialSummary?: string;
}

export abstract class PlacesProvider {
  abstract searchNearby(
    input: NearbySearchInput,
  ): Promise<RestaurantCandidate[]>;

  abstract getPlaceDetails(providerPlaceId: string): Promise<RestaurantDetails>;
}
