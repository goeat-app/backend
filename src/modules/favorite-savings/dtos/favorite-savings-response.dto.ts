export class FavoriteRestaurantSummaryDto {
  id: string;
  name: string;
  placeType: string;
  slug: string;
  foodType: string;
  priceLevel: number;
  avgRating: number;
  address: string;
  city: string;
  state: string;
}

export class FavoriteSavingsResponseDto {
  userId: string;
  restaurantIds: string[];
  restaurants: FavoriteRestaurantSummaryDto[];
}
