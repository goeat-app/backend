import { Injectable } from '@nestjs/common';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { IProfileMappingRepository } from '../../domain/interfaces/profile-mapping.interface';

@Injectable()
export class ProfileMappingUseCase {
  constructor(
    private readonly profileMappingRepository: IProfileMappingRepository,
  ) {}

  async createProfileMapping(
    profileMapping: CreateProfileMappingDto,
  ): Promise<void> {
    await this.profileMappingRepository.create({
      userId: profileMapping.userId,
      foodTypes: profileMapping.foodTypes,
      placeTypes: profileMapping.placeTypes,
      priceRange: profileMapping.priceRange,
    });
  }
}
