import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import {
  IUserPreferenceRepository,
  UpsertUserPreferencesInput,
} from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';
import { UserPreferenceEntity } from '@/modules/recommendation/domain/entities/user-preference.entity';
import { UserPreferenceModel } from '../../database/user-preference.model';

@Injectable()
export class UserPreferenceRepository implements IUserPreferenceRepository {
  constructor(
    @InjectModel(ProfileMappingModel)
    private readonly profileMappingModel: typeof ProfileMappingModel,
    @InjectModel(UserPreferenceModel)
    private readonly userPreferenceModel: typeof UserPreferenceModel,
  ) {}

  async findUserPreferencesByUserId(userId: string) {
    const explicitPreferences = await this.userPreferenceModel.findOne({
      where: { user_id: userId },
    });

    if (explicitPreferences) {
      return this.toEntity(explicitPreferences);
    }

    const result = await this.profileMappingModel.findOne({
      where: { userId },
      include: [
        {
          model: PlaceTypeModel,
          required: false,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
        {
          model: FoodTypeModel,
          required: false,
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!result) return null;

    return new UserPreferenceEntity(
      result?.userId,
      result.maxPrice != null ? Number(result.maxPrice) : null,
      result.minPrice != null ? Number(result.minPrice) : null,
      result.placeTypes?.map((type) => (type.get() as { name: string }).name) ??
        [],
      result.foodTypes?.map((type) => (type.get() as { name: string }).name) ??
        [],
      null,
      null,
      result.foodTypes?.map((type) => (type.get() as { name: string }).name) ??
        [],
      result.placeTypes?.map((type) => (type.get() as { name: string }).name) ??
        [],
      this.toBudgetLevel(Number(result.maxPrice)),
    );
  }

  async upsertUserPreferences(
    input: UpsertUserPreferencesInput,
  ): Promise<UserPreferenceEntity> {
    const now = new Date();
    const [record] = await this.userPreferenceModel.findOrCreate({
      where: { user_id: input.userId },
      defaults: {
        user_id: input.userId,
        favorite_cuisines: input.favoriteCuisines,
        preferred_ambiance: input.preferredAmbiance,
        budget_level: input.budgetLevel,
        created_at: now,
        updated_at: now,
      },
    });

    await record.update({
      favorite_cuisines: input.favoriteCuisines,
      preferred_ambiance: input.preferredAmbiance,
      budget_level: input.budgetLevel,
      updated_at: now,
    });

    return this.toEntity(record);
  }

  private toEntity(record: UserPreferenceModel): UserPreferenceEntity {
    return new UserPreferenceEntity(
      record.user_id,
      null,
      null,
      record.preferred_ambiance ?? [],
      null,
      null,
      record.favorite_cuisines ?? [],
      record.preferred_ambiance ?? [],
      record.budget_level,
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
