import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { IProfileMappingRepository } from '../../domain/interfaces/profile-mapping.interface';
import { ProfileMappingResponseType } from '../../dtos/profile-response.dto';

@Injectable()
export class ProfileMappingUseCase {
  constructor(
    private readonly profileMappingRepository: IProfileMappingRepository,
  ) {}

  async createProfileMapping(
    userId: string,
    profileMapping: CreateProfileMappingDto,
  ): Promise<void> {
    await this.profileMappingRepository.create(userId, {
      foodTypes: profileMapping.foodTypes,
      placeTypes: profileMapping.placeTypes,
      priceRange: profileMapping.priceRange,
    });
  }

  async getProfileMapping(userId: string): Promise<ProfileMappingResponseType> {
    const profileMapping =
      await this.profileMappingRepository.findByUserId(userId);

    if (!profileMapping) {
      throw new NotFoundException('Profile mapping not found');
    }

    return profileMapping;
  }
}
