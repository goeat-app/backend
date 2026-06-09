import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
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
      ],
    });

    if (!result) return null;

    const plain = result.get({ plain: true });

    return new UserPreferenceEntity(
      plain?.userId,
      Number(plain.maxPrice),
      Number(plain.minPrice),
      plain.placeTypes?.map((type: { name: string }) => type.name) ?? [],
      null,
      null,
    );
  }
}
