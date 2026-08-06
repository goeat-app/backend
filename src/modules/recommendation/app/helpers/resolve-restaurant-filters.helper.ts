import { UserPreferenceEntity } from '../../domain/entities/user-preference.entity';
import {
  DEFAULT_FILTER_MAX_PRICE,
  DEFAULT_FILTER_MIN_PRICE,
  RestaurantQueryFilters,
} from '../../domain/types/restaurant-query-filters.type';
import {
  normalizeFoodTypeNames,
  normalizePlaceTypeNames,
} from './normalize-filter-names.helper';

export function resolveRestaurantFilters(
  session: RestaurantQueryFilters | undefined,
  preferences?: UserPreferenceEntity | null,
): RestaurantQueryFilters {
  const filters: RestaurantQueryFilters = {};

  if (session?.minRating && session.minRating > 0) {
    filters.minRating = session.minRating;
  }

  const sessionMinPrice =
    session?.minPrice !== undefined &&
    session.minPrice !== DEFAULT_FILTER_MIN_PRICE
      ? session.minPrice
      : undefined;
  const sessionMaxPrice =
    session?.maxPrice !== undefined &&
    session.maxPrice !== DEFAULT_FILTER_MAX_PRICE
      ? session.maxPrice
      : undefined;

  if (sessionMinPrice !== undefined) {
    filters.minPrice = sessionMinPrice;
  } else if (preferences?.minPrice != null) {
    filters.minPrice = preferences.minPrice;
  }

  if (sessionMaxPrice !== undefined) {
    filters.maxPrice = sessionMaxPrice;
  } else if (preferences?.maxPrice != null) {
    filters.maxPrice = preferences.maxPrice;
  }

  if (session?.foodTypes?.length) {
    filters.foodTypes = normalizeFoodTypeNames(session.foodTypes);
  }

  if (session?.restaurantStyles?.length) {
    filters.restaurantStyles = normalizePlaceTypeNames(
      session.restaurantStyles,
    );
  }

  return filters;
}
