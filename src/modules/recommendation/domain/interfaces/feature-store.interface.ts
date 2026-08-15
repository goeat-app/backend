import { RestaurantsModel } from '../../infra/database/restaurant.model';

export interface RecommendationContext {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requestedAt: Date;
}

export interface UserFeatureVector {
  userId: string;
  favoriteCuisines: string[];
  preferredAmbiance: string[];
  budgetLevel: number | null;
  cuisineAffinities: Record<string, number>;
  ambianceAffinities: Record<string, number>;
  budgetAffinity: Record<string, number>;
}

export interface RestaurantFeatureVector {
  restaurantId: string;
  cuisineMatch: number;
  budgetMatch: number;
  ambianceMatch: number;
  normalizedRating: number;
  normalizedDistance: number;
  popularityScore: number;
  distanceMeters: number;
}

export interface ContextFeatureVector {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  requestedAt: Date;
  dayOfWeek: number;
  hourOfDay: number;
}

export abstract class FeatureStore {
  abstract buildUserFeatures(userId: string): Promise<UserFeatureVector>;

  abstract buildRestaurantFeatures(
    restaurant: RestaurantsModel,
    context: RecommendationContext,
    userFeatures: UserFeatureVector,
  ): RestaurantFeatureVector;

  abstract buildContextFeatures(
    context: RecommendationContext,
  ): ContextFeatureVector;
}
