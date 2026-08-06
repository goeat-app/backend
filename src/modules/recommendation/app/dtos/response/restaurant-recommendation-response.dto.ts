export interface RestaurantRecommendationResponseDto {
  address: string;
  averagePrice: number;
  avgRating: number;
  city: string;
  foodType: string;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  latitude: number;
  longitude: number;
  name: string;
  placeType: string;
  priceLevel: number;
  slug: string;
  restaurantSlug: string;
  state: string;
}
