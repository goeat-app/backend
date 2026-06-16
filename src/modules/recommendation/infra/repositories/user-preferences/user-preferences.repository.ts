import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { IUserPreferenceRepository } from '@/modules/recommendation/domain/interfaces/repositories/user-preference-repository.interface';
import { UserPreferenceEntity } from '@/modules/recommendation/domain/entities/user-preference.entity';

@Injectable()
export class UserPreferenceRepository implements IUserPreferenceRepository {
  constructor(
    @InjectModel(ProfileMappingModel)
    private readonly profileMappingModel: typeof ProfileMappingModel,
  ) {}

  async findUserPreferencesByUserId(userId: string) {
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
    );
  }
}
