import { Injectable } from '@nestjs/common';
import { IProfileMappingPlaceTypeRepository } from '../../domain/interfaces/profile-mapping-place-type.interface';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingPlaceTypeModel } from '../database/profile-mapping-place-type.model';

@Injectable()
export class SequelizePlaceTypeProfileMappingRepository
  implements IProfileMappingPlaceTypeRepository
{
  constructor(
    @InjectModel(ProfileMappingPlaceTypeModel)
    private readonly profileMappingPlaceTypeModel: typeof ProfileMappingPlaceTypeModel,
  ) {}

  async findMappingPlaceTypes(
    profileMappingId: string,
  ): Promise<ProfileMappingPlaceTypeModel[]> {
    try {
      const placesTypes = await this.profileMappingPlaceTypeModel.findAll({
        where: { profileMappingId },
      });
      return placesTypes;
    } catch (error) {
      throw new Error('Place types not found.');
    }
  }
}
