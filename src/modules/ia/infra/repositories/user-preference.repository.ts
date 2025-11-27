import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';

@Injectable()
export class UserPreferenceRepository {
  constructor(
    @InjectModel(ProfileMappingModel)
    private readonly profileMappingModel: typeof ProfileMappingModel,
  ) {}

  async findUserPreferencesByUserId(userId: string) {
    return await this.profileMappingModel.findOne({
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
  }
}
