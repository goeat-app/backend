import { BadRequestException, Injectable } from '@nestjs/common';
import { IProfileMappingRepository } from '../../domain/interfaces/profile-mapping.interface';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { InjectModel } from '@nestjs/sequelize';
import { ProfileMappingModel } from '../database/profile-mapping-model';
import { FoodTypeModel } from '../database/food-type.model';
import { PlaceTypeModel } from '../database/place-type.model';
import { ProfileMappingResponseType } from '../../dtos/profile-response.dto';

@Injectable()
export class SequelizeProfileMappingRepository implements IProfileMappingRepository {
  constructor(
    @InjectModel(ProfileMappingModel)
    private readonly profileMappingModel: typeof ProfileMappingModel,
  ) {}

  async create(userId: string, data: CreateProfileMappingDto): Promise<void> {
    try {
      const profileMapping = await this.profileMappingModel.create({
        userId: userId,
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
    } catch (_error) {
      throw new BadRequestException('Failed to create profile mapping');
    }
  }

  async findByUserId(
    userId: string,
  ): Promise<ProfileMappingResponseType | null> {
    const profileMapping = await this.profileMappingModel.findOne({
      where: { userId },
      include: [
        {
          model: FoodTypeModel,
          attributes: ['id'],
          through: { attributes: [] },
        },
        {
          model: PlaceTypeModel,
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });

    if (!profileMapping) {
      return null;
    }

    return {
      id: profileMapping.id,
      userId: profileMapping.userId,
      priceRange: {
        minValue: Number(profileMapping.minPrice),
        maxValue: Number(profileMapping.maxPrice),
      },
      foodTypes: profileMapping.foodTypes.map(({ id }) => ({ id })),
      placeTypes: profileMapping.placeTypes.map(({ id }) => ({ id })),
      createdAt: profileMapping.createdAt,
      updatedAt: profileMapping.updatedAt,
    };
  }
}
