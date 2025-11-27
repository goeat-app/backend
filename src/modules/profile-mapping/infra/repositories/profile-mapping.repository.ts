import { BadRequestException, Injectable } from '@nestjs/common';
import { IProfileMappingRepository } from '../../domain/interfaces/profile-mapping.interface';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '../database/profile-mapping-model';

@Injectable()
export class SequelizeProfileMappingRepository
  implements IProfileMappingRepository
{
  constructor(
    @InjectModel(ProfileMappingModel)
    private readonly profileMappingModel: typeof ProfileMappingModel,
  ) {}

  async create(data: CreateProfileMappingDto): Promise<void> {
    try {
      const profileMapping = await this.profileMappingModel.create({
        userId: data.userId,
        minPrice: data.priceRange.minValue,
        maxPrice: data.priceRange.maxValue,
      });

      await Promise.all([
        profileMapping.$set(
          'foodTypes',
          data.foodTypes.map((id) => id),
        ),
        profileMapping.$set(
          'placeTypes',
          data.placeTypes.map((id) => id),
        ),
      ]);
    } catch (error) {
      throw new BadRequestException('Failed to create profile mapping');
    }
  }
}
