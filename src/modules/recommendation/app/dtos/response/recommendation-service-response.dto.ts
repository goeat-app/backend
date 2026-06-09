export interface RecommendedRestaurant {
  restaurantId: string;
}

export interface RecommendationServiceResponseDto {
  restaurants: RecommendedRestaurant[];
}
