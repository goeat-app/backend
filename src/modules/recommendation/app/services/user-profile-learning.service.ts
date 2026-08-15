import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { UserProfileModel } from '@/modules/recommendation/infra/database/user-profile.model';
import { clamp } from '../utils/distance';

interface ApplyFeedbackInput {
  userId: string;
  restaurant: RestaurantsModel;
  type: RecommendationInteractionType;
  rating?: number;
}

const PROFILE_VERSION = 'user_profile_v1';

@Injectable()
export class UserProfileLearningService {
  constructor(
    @InjectModel(UserProfileModel)
    private readonly userProfileModel: typeof UserProfileModel,
  ) {}

  async applyFeedback(input: ApplyFeedbackInput): Promise<void> {
    const weight = this.getWeight(input.type, input.rating);
    if (weight === 0) return;

    const now = new Date();
    const [profile] = await this.userProfileModel.findOrCreate({
      where: { user_id: input.userId },
      defaults: {
        user_id: input.userId,
        profile_version: PROFILE_VERSION,
        cuisine_affinities: {},
        ambiance_affinities: {},
        budget_affinity: {},
        updated_at: now,
      },
    });
    const cuisineAffinities = this.applyWeightToAffinities(
      this.cloneAffinity(profile.cuisine_affinities),
      weight,
      this.getCuisineSignals(input.restaurant),
    );
    const ambianceAffinities = this.applyWeightToAffinities(
      this.cloneAffinity(profile.ambiance_affinities),
      weight,
      this.getAmbianceSignals(input.restaurant),
    );
    const budgetAffinity = this.applyWeightToAffinities(
      this.cloneAffinity(profile.budget_affinity),
      weight,
      input.restaurant.price_level !== null
        ? [String(input.restaurant.price_level)]
        : [],
    );

    await profile.update({
      profile_version: PROFILE_VERSION,
      cuisine_affinities: cuisineAffinities,
      ambiance_affinities: ambianceAffinities,
      budget_affinity: budgetAffinity,
      updated_at: now,
    });
  }

  async resetProfile(userId: string): Promise<void> {
    const now = new Date();
    const [profile] = await this.userProfileModel.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        profile_version: PROFILE_VERSION,
        cuisine_affinities: {},
        ambiance_affinities: {},
        budget_affinity: {},
        updated_at: now,
      },
    });

    await profile.update({
      profile_version: PROFILE_VERSION,
      cuisine_affinities: {},
      ambiance_affinities: {},
      budget_affinity: {},
      updated_at: now,
    });
  }

  private getWeight(
    type: RecommendationInteractionType,
    rating?: number,
  ): number {
    if (type === RecommendationInteractionType.Like) return 0.1;
    if (type === RecommendationInteractionType.Dislike) return -0.1;
    if (type !== RecommendationInteractionType.Rating) return 0;

    if (rating === 5) return 0.15;
    if (rating === 4) return 0.1;
    if (rating === 2) return -0.1;
    if (rating === 1) return -0.15;
    return 0;
  }

  private adjust(value: unknown, delta: number): number {
    return clamp(Number(value ?? 0) + delta, -1, 1);
  }

  private cloneAffinity(
    value: Record<string, unknown> | null,
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(value ?? {}).map(([key, entry]) => [key, Number(entry)]),
    );
  }

  private applyWeightToAffinities(
    values: Record<string, number>,
    weight: number,
    signals: string[],
  ): Record<string, number> {
    const result = { ...values };

    for (const key of Object.keys(result)) {
      result[key] = this.adjust(result[key], weight);
    }

    for (const signal of signals) {
      if (!(signal in result)) {
        result[signal] = this.adjust(undefined, weight);
      }
    }

    return result;
  }

  private getCuisineSignals(restaurant: RestaurantsModel): string[] {
    return [restaurant.primary_type, ...(restaurant.types ?? [])]
      .filter((value): value is string => Boolean(value))
      .map((value) => this.normalize(value));
  }

  private getAmbianceSignals(restaurant: RestaurantsModel): string[] {
    return [restaurant.primary_type]
      .filter((value): value is string => Boolean(value))
      .map((value) => this.normalize(value));
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
  }
}
