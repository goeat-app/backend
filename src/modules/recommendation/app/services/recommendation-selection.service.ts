import { Injectable } from '@nestjs/common';
import { ScoredRestaurant } from '@/modules/recommendation/domain/interfaces/recommendation-scorer.interface';
import { RestaurantFeatureVector } from '@/modules/recommendation/domain/interfaces/feature-store.interface';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RecommendationStrategyConfigService } from './recommendation-strategy-config.service';

export interface SelectedRecommendation {
  restaurant: RestaurantsModel;
  feature: RestaurantFeatureVector;
  score: number;
  scoreBreakdown?: Record<string, number>;
  isPrimary: boolean;
}

@Injectable()
export class RecommendationSelectionService {
  constructor(
    private readonly strategyConfigService: RecommendationStrategyConfigService,
  ) {}

  select(
    scoredRestaurants: ScoredRestaurant[],
    restaurants: RestaurantsModel[],
    restaurantFeatures: RestaurantFeatureVector[],
  ): SelectedRecommendation[] {
    const restaurantsById = new Map(
      restaurants.map((restaurant) => [restaurant.id, restaurant]),
    );
    const featuresByRestaurantId = new Map(
      restaurantFeatures.map((feature) => [feature.restaurantId, feature]),
    );
    const ordered = scoredRestaurants
      .map((scored) => ({
        scored,
        restaurant: restaurantsById.get(scored.restaurantId),
        feature: featuresByRestaurantId.get(scored.restaurantId),
      }))
      .filter(
        (
          item,
        ): item is {
          scored: ScoredRestaurant;
          restaurant: RestaurantsModel;
          feature: RestaurantFeatureVector;
        } => Boolean(item.restaurant && item.feature),
      )
      .sort((left, right) => this.compare(left, right));

    const selected: SelectedRecommendation[] = [];
    const cuisineCounts = new Map<string, number>();

    const rules = this.strategyConfigService.getBusinessRulesConfig();
    const maxSelected = rules.heroCount + rules.secondaryCount;

    for (const item of ordered) {
      if (selected.length >= maxSelected) break;

      const cuisine = this.getCuisineGroup(item.restaurant);
      const cuisineCount = cuisineCounts.get(cuisine) ?? 0;

      if (
        rules.minimumCuisineDiversity > 1 &&
        selected.length >= rules.minimumCuisineDiversity &&
        cuisineCount >= maxSelected - rules.minimumCuisineDiversity
      ) {
        continue;
      }

      selected.push({
        restaurant: item.restaurant,
        feature: item.feature,
        score: item.scored.score,
        scoreBreakdown: item.scored.scoreBreakdown,
        isPrimary: selected.length < rules.heroCount,
      });
      cuisineCounts.set(cuisine, cuisineCount + 1);
    }

    if (selected.length < 5) {
      for (const item of ordered) {
        if (selected.length >= maxSelected) break;
        if (
          selected.some(
            (selectedItem) => selectedItem.restaurant.id === item.restaurant.id,
          )
        ) {
          continue;
        }

        selected.push({
          restaurant: item.restaurant,
          feature: item.feature,
          score: item.scored.score,
          scoreBreakdown: item.scored.scoreBreakdown,
          isPrimary: selected.length < rules.heroCount,
        });
      }
    }

    return selected;
  }

  private compare(
    left: {
      scored: ScoredRestaurant;
      restaurant: RestaurantsModel;
      feature: RestaurantFeatureVector;
    },
    right: {
      scored: ScoredRestaurant;
      restaurant: RestaurantsModel;
      feature: RestaurantFeatureVector;
    },
  ): number {
    const scoreDelta = right.scored.score - left.scored.score;
    if (Math.abs(scoreDelta) > 0.01) return scoreDelta;

    const ratingCountDelta =
      Number(right.restaurant.google_rating_count ?? 0) -
      Number(left.restaurant.google_rating_count ?? 0);
    if (ratingCountDelta !== 0) return ratingCountDelta;

    const distanceDelta =
      left.feature.distanceMeters - right.feature.distanceMeters;
    if (distanceDelta !== 0) return distanceDelta;

    return left.restaurant.id.localeCompare(right.restaurant.id);
  }

  private getCuisineGroup(restaurant: RestaurantsModel): string {
    return (
      restaurant.primary_type ??
      restaurant.types?.[0] ??
      restaurant.foodType?.name ??
      'unknown'
    );
  }
}
