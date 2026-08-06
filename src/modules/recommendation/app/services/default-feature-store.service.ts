import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IUserPreferenceRepository } from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';
import {
  ContextFeatureVector,
  FeatureStore,
  RecommendationContext,
  RestaurantFeatureVector,
  UserFeatureVector,
} from '@/modules/recommendation/domain/interfaces/feature-store.interface';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { UserProfileModel } from '@/modules/recommendation/infra/database/user-profile.model';
import { calculateDistanceMeters, clamp } from '../utils/distance';

@Injectable()
export class DefaultFeatureStore extends FeatureStore {
  constructor(
    private readonly userPreferenceRepository: IUserPreferenceRepository,
    @InjectModel(UserProfileModel)
    private readonly userProfileModel: typeof UserProfileModel,
  ) {
    super();
  }

  async buildUserFeatures(userId: string): Promise<UserFeatureVector> {
    const preferences =
      await this.userPreferenceRepository.findUserPreferencesByUserId(userId);
    const profile = await this.userProfileModel.findOne({
      where: { user_id: userId },
    });

    return {
      userId,
      favoriteCuisines: (preferences?.favoriteCuisines.length
        ? preferences.favoriteCuisines
        : (preferences?.preferredPlaceTypes ?? [])
      ).map((type) => this.normalizeLabel(type)),
      preferredAmbiance: (preferences?.preferredAmbiance.length
        ? preferences.preferredAmbiance
        : (preferences?.preferredPlaceTypes ?? [])
      ).map((type) => this.normalizeLabel(type)),
      budgetLevel:
        preferences?.budgetLevel ??
        this.toBudgetLevel(preferences?.maxPrice ?? null),
      cuisineAffinities: this.toNumericAffinity(profile?.cuisine_affinities),
      ambianceAffinities: this.toNumericAffinity(profile?.ambiance_affinities),
      budgetAffinity: this.toNumericAffinity(profile?.budget_affinity),
    };
  }

  buildRestaurantFeatures(
    restaurant: RestaurantsModel,
    context: RecommendationContext,
    userFeatures: UserFeatureVector,
  ): RestaurantFeatureVector {
    const distanceMeters = calculateDistanceMeters(
      { latitude: context.latitude, longitude: context.longitude },
      {
        latitude: Number(restaurant.latitude),
        longitude: Number(restaurant.longitude),
      },
    );
    const restaurantTypes = [
      restaurant.primary_type,
      ...(restaurant.types ?? []),
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => this.normalizeLabel(value));

    return {
      restaurantId: restaurant.id,
      cuisineMatch: this.matchWithAffinity(
        restaurantTypes,
        userFeatures.favoriteCuisines,
        userFeatures.cuisineAffinities,
      ),
      budgetMatch: this.matchBudget(
        restaurant.price_level,
        userFeatures.budgetLevel,
        userFeatures.budgetAffinity,
      ),
      ambianceMatch: this.matchWithAffinity(
        restaurantTypes,
        userFeatures.preferredAmbiance,
        userFeatures.ambianceAffinities,
      ),
      normalizedRating: clamp(Number(restaurant.google_rating ?? 0) / 5),
      normalizedDistance: clamp(1 - distanceMeters / context.radiusMeters),
      popularityScore: clamp(
        Math.log10(Number(restaurant.google_rating_count ?? 0) + 1) / 4,
      ),
      openNow: restaurant.open_now === false ? 0 : 1,
      distanceMeters,
    };
  }

  buildContextFeatures(context: RecommendationContext): ContextFeatureVector {
    return {
      latitude: context.latitude,
      longitude: context.longitude,
      radiusMeters: context.radiusMeters,
      requestedAt: context.requestedAt,
      dayOfWeek: context.requestedAt.getUTCDay(),
      hourOfDay: context.requestedAt.getUTCHours(),
    };
  }

  private matchAny(values: string[], preferences: string[]): number {
    if (!preferences.length) return 0.5;

    return values.some((value) => preferences.includes(value)) ? 1 : 0;
  }

  private matchWithAffinity(
    values: string[],
    preferences: string[],
    affinities: Record<string, number>,
  ): number {
    const explicitScore = this.matchAny(values, preferences);
    const learnedScore = values.reduce(
      (best, value) => Math.max(best, affinities[value] ?? 0),
      -1,
    );

    return clamp(explicitScore + learnedScore * 0.25);
  }

  private matchBudget(
    restaurantPriceLevel: number | null,
    userBudgetLevel: number | null,
    budgetAffinity: Record<string, number>,
  ): number {
    if (restaurantPriceLevel === null) return 0.5;
    const learnedScore = budgetAffinity[String(restaurantPriceLevel)] ?? 0;

    if (userBudgetLevel === null) {
      return clamp(0.5 + learnedScore * 0.25);
    }

    return clamp(
      1 -
        Math.abs(restaurantPriceLevel - userBudgetLevel) / 4 +
        learnedScore * 0.25,
    );
  }

  private normalizeLabel(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
  }

  private toNumericAffinity(
    value?: Record<string, unknown> | null,
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(value ?? {}).map(([key, entry]) => [key, Number(entry)]),
    );
  }

  private toBudgetLevel(maxPrice: number | null): number | null {
    if (maxPrice === null || Number.isNaN(Number(maxPrice))) return null;
    if (maxPrice <= 30) return 1;
    if (maxPrice <= 50) return 2;
    if (maxPrice <= 80) return 3;
    if (maxPrice <= 120) return 4;
    return 5;
  }
}
