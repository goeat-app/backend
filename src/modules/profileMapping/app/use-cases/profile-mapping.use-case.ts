import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { IProfileMappingRepository } from '../../domain/interfaces/profile-mapping.interface';
import { IProfileMappingFoodTypeRepository } from '../../domain/interfaces/profile-mapping-food-type.interface';
import { IProfileMappingPlaceTypeRepository } from '../../domain/interfaces/profile-mapping-place-type.interface';
import { ProfileMappingResponseDto } from '../../dtos/profile-response.dto';

@Injectable()
export class ProfileMappingUseCase {
    constructor(
        private readonly profileMappingRepository: IProfileMappingRepository,
        private readonly profileMappingFoodTypesRepository: IProfileMappingFoodTypeRepository, 
        private readonly profileMappingPlaceTypeRepository: IProfileMappingPlaceTypeRepository,
    ) { }

    async createProfileMapping(profileMapping: CreateProfileMappingDto) : Promise<{ message: string }> {
        try {
            const profile = await this.profileMappingRepository.create({
                userId: profileMapping.userId,
                foodTypes: profileMapping.foodTypes,
                placeTypes: profileMapping.placeTypes,
                priceRange: profileMapping.priceRange
            });

            return { message: 'Profile mapping received'};
        } catch (error) {
            throw error;
        }
    }

    async getProfileMappingById(userId: string): Promise<ProfileMappingResponseDto> {
        try {
            const mapper = await this.profileMappingRepository.findMapperProfileByUserId(userId); 

            if (!mapper) {
                throw new NotFoundException('User map profile not found');
            }

            const foodTypesMapping = await this.profileMappingFoodTypesRepository.findMappingFoodTypes(mapper.id); 
            
            const placeTypesMapping = await this.profileMappingPlaceTypeRepository.findMappingPlaceTypes(mapper.id); 

            const profile = {
                ...mapper.dataValues,         
                foodTypes: foodTypesMapping.map(ft => ft.id),
                placeTypes: placeTypesMapping.map(pt => pt.id),
            }

            return profile;

        } catch (error) {
            throw error;
        }
    }
}
