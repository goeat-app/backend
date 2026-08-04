export interface NearbyRestaurantsResponseDto {
  id: string;
  name: string;
  slug: string | null;
  provider: string | null;
  providerPlaceId: string | null;
  primaryType: string | null;
  types: string[] | null;
  priceLevel: number | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  businessStatus: string | null;
  openNow: boolean | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  editorialSummary: string | null;
  editorialSummarySource: 'google' | 'generated' | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  isActive: boolean;
}
