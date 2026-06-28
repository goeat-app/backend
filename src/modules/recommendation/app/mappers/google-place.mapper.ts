import {
  RestaurantCandidate,
  RestaurantDetails,
} from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

export interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  priceLevel?: string | number;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  editorialSummary?: { text?: string };
}

const priceLevelMap: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export class GooglePlaceMapper {
  static toRestaurantCandidate(place: GooglePlace): RestaurantCandidate | null {
    if (
      !place.id ||
      !place.displayName?.text ||
      place.location?.latitude === undefined ||
      place.location.longitude === undefined
    ) {
      return null;
    }

    return {
      provider: RestaurantProvider.GooglePlaces,
      providerPlaceId: place.id,
      name: place.displayName.text,
      location: {
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      },
      types: place.types ?? [],
      primaryType: place.primaryType,
      priceLevel: this.mapPriceLevel(place.priceLevel),
      rating: place.rating,
      ratingCount: place.userRatingCount,
      businessStatus: place.businessStatus,
      openNow: place.currentOpeningHours?.openNow,
    };
  }

  static toRestaurantDetails(place: GooglePlace): RestaurantDetails | null {
    const candidate = this.toRestaurantCandidate(place);

    if (!candidate) {
      return null;
    }

    return {
      ...candidate,
      website: place.websiteUri,
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
      editorialSummary: place.editorialSummary?.text,
    };
  }

  private static mapPriceLevel(
    priceLevel?: string | number,
  ): number | undefined {
    if (priceLevel === undefined) return undefined;
    if (typeof priceLevel === 'number') return priceLevel;

    return priceLevelMap[priceLevel];
  }
}
