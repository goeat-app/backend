import {
  RestaurantCandidate,
  RestaurantDetails,
} from '@/modules/recommendation/domain/interfaces/places-provider.interface';
import { RestaurantProvider } from '@/modules/recommendation/domain/enums/restaurant-provider.enum';

export interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    types?: string[];
  }>;
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
  generativeSummary?: {
    overview?: {
      text?: string;
    };
  };
  photos?: Array<{
    name?: string;
  }>;
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
      address: this.buildStreetAddress(place.addressComponents),
      city:
        this.extractAddressComponent(place.addressComponents, ['locality']) ??
        this.extractAddressComponent(place.addressComponents, [
          'administrative_area_level_2',
        ]),
      state: this.extractAddressComponent(place.addressComponents, [
        'administrative_area_level_1',
      ]),
      postalCode: this.extractAddressComponent(place.addressComponents, [
        'postal_code',
      ]),
      types: place.types ?? [],
      primaryType: place.primaryType,
      priceLevel: this.mapPriceLevel(place.priceLevel),
      rating: place.rating,
      ratingCount: place.userRatingCount,
      businessStatus: place.businessStatus,
      openNow: place.currentOpeningHours?.openNow,
    };
  }

  static toRestaurantDetails(
    place: GooglePlace,
    options?: { googleApiKey?: string; photoMaxHeightPx?: number },
  ): RestaurantDetails | null {
    const candidate = this.toRestaurantCandidate(place);

    if (!candidate) {
      return null;
    }

    const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber;
    const googleEditorialSummary = place.editorialSummary?.text?.trim();
    const generatedSummary = this.buildGeneratedSummary(candidate);
    const editorialSummary = googleEditorialSummary ?? generatedSummary;
    const description =
      place.generativeSummary?.overview?.text?.trim() ??
      googleEditorialSummary ??
      this.buildGeneratedDescription(candidate);

    return {
      ...candidate,
      website: place.websiteUri,
      phone,
      // Google Places does not expose a dedicated WhatsApp field.
      whatsapp: phone,
      description,
      imageUrl: this.buildImageUrl(
        place.photos?.[0]?.name,
        options?.googleApiKey,
        options?.photoMaxHeightPx,
      ),
      editorialSummary,
      editorialSummarySource: googleEditorialSummary ? 'google' : 'generated',
    };
  }

  private static buildGeneratedDescription(
    candidate: RestaurantCandidate,
  ): string {
    const parts = [
      this.humanizePrimaryType(candidate.primaryType),
      candidate.city ? `em ${candidate.city}` : undefined,
      this.describePriceLevel(candidate.priceLevel),
      this.describeRating(candidate.rating, candidate.ratingCount),
      this.describeOpenNow(candidate.openNow),
    ].filter((part): part is string => Boolean(part));

    if (!parts.length) {
      return `${candidate.name} no Google Places.`;
    }

    return `${candidate.name}: ${parts.join(', ')}.`;
  }

  private static buildGeneratedSummary(candidate: RestaurantCandidate): string {
    const type =
      this.humanizePrimaryType(candidate.primaryType) ?? 'Restaurante local';
    const cityPart = candidate.city ? ` em ${candidate.city}` : '';
    const ratingPart = this.describeRating(
      candidate.rating,
      candidate.ratingCount,
    );
    const statusPart = this.describeOpenNow(candidate.openNow);
    const extra = [ratingPart, statusPart]
      .filter((part): part is string => Boolean(part))
      .join(', ');

    if (!extra) {
      return `${type}${cityPart} encontrado no Google Places.`;
    }

    return `${type}${cityPart}, ${extra}.`;
  }

  private static humanizePrimaryType(primaryType?: string): string | undefined {
    if (!primaryType) return undefined;
    return primaryType
      .split('_')
      .map((token) => token[0].toUpperCase() + token.slice(1))
      .join(' ');
  }

  private static describePriceLevel(priceLevel?: number): string | undefined {
    if (priceLevel === undefined) return undefined;

    const labels: Record<number, string> = {
      0: 'faixa de preco gratis',
      1: 'faixa de preco economica',
      2: 'faixa de preco moderada',
      3: 'faixa de preco alta',
      4: 'faixa de preco premium',
    };

    return labels[priceLevel] ?? undefined;
  }

  private static describeRating(
    rating?: number,
    ratingCount?: number,
  ): string | undefined {
    if (rating === undefined) return undefined;

    const normalizedRating = Number(rating.toFixed(1));
    if (ratingCount === undefined || ratingCount <= 0) {
      return `nota ${normalizedRating}`;
    }

    return `nota ${normalizedRating} (${ratingCount} avaliacoes)`;
  }

  private static describeOpenNow(openNow?: boolean): string | undefined {
    if (openNow === undefined) return undefined;
    return openNow ? 'aberto agora' : 'fechado no momento';
  }

  private static buildImageUrl(
    photoName?: string,
    googleApiKey?: string,
    photoMaxHeightPx = 600,
  ): string | undefined {
    if (!photoName || !googleApiKey) return undefined;

    return `https://places.googleapis.com/v1/${photoName}/media?key=${encodeURIComponent(
      googleApiKey,
    )}&maxHeightPx=${photoMaxHeightPx}&skipHttpRedirect=true`;
  }

  private static extractAddressComponent(
    addressComponents: GooglePlace['addressComponents'],
    types: string[],
  ): string | undefined {
    const match = addressComponents?.find((component) =>
      component.types?.some((type) => types.includes(type)),
    );

    return match?.longText?.trim() || undefined;
  }

  private static buildStreetAddress(
    addressComponents: GooglePlace['addressComponents'],
  ): string | undefined {
    const route = this.extractAddressComponent(addressComponents, ['route']);
    const streetNumber = this.extractAddressComponent(addressComponents, [
      'street_number',
    ]);

    if (route && streetNumber) {
      return `${route}, ${streetNumber}`;
    }

    return route ?? streetNumber;
  }

  private static mapPriceLevel(
    priceLevel?: string | number,
  ): number | undefined {
    if (priceLevel === undefined) return undefined;
    if (typeof priceLevel === 'number') return priceLevel;

    return priceLevelMap[priceLevel];
  }
}
