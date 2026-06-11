export interface Restaurant {
  restaurantId: string;
  restaurantType: string;
  averagePrice: number;
}

export interface Review {
  userId: string;
  restaurantId: string;
  rating: number;
}

export interface RecommendationServiceRequestDto {
  maxPrice: number;
  restaurants: Restaurant[];
  reviews: Review[];
  preferredTypes: string[];
}
