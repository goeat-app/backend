import { RestaurantQueryFilters } from '../../../domain/types/restaurant-query-filters.type';

type QueryParams = {
  minRating?: string;
  foodTypes?: string;
  restaurantStyles?: string;
  minPrice?: string;
  maxPrice?: string;
};

function parseCommaSeparated(value?: string): string[] | undefined {
  if (!value) return undefined;

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

export function parseRestaurantQueryFilters(
  query: QueryParams,
): RestaurantQueryFilters | undefined {
  const filters: RestaurantQueryFilters = {};

  if (query.minRating) {
    const minRating = Number(query.minRating);
    if (minRating > 0) {
      filters.minRating = minRating;
    }
  }

  const foodTypes = parseCommaSeparated(query.foodTypes);
  if (foodTypes) {
    filters.foodTypes = foodTypes;
  }

  const restaurantStyles = parseCommaSeparated(query.restaurantStyles);
  if (restaurantStyles) {
    filters.restaurantStyles = restaurantStyles;
  }

  if (query.minPrice) {
    const minPrice = Number(query.minPrice);
    if (!Number.isNaN(minPrice)) {
      filters.minPrice = minPrice;
    }
  }

  if (query.maxPrice) {
    const maxPrice = Number(query.maxPrice);
    if (!Number.isNaN(maxPrice)) {
      filters.maxPrice = maxPrice;
    }
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}
