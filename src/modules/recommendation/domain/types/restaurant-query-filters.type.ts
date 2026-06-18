export type RestaurantQueryFilters = {
  minRating?: number;
  foodTypes?: string[];
  restaurantStyles?: string[];
  minPrice?: number;
  maxPrice?: number;
};

export const DEFAULT_FILTER_MIN_PRICE = 20;
export const DEFAULT_FILTER_MAX_PRICE = 300;
