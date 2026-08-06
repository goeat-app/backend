export class FavoriteRestaurantSummaryDto {
  id!: string;
  name!: string;
  placeType!: string;
  slug!: string;
  restaurantSlug!: string;
  foodType!: string;
  priceLevel!: number;
  avgRating!: number;
  address!: string;
  city!: string;
  state!: string;
  latitude!: number;
  longitude!: number;
  imageUrl!: string | null;
}

export class FavoriteSavingsResponseDto {
  userId!: string;
  restaurantIds!: string[];
  restaurants!: FavoriteRestaurantSummaryDto[];
}
