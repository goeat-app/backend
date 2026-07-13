import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';
import { ProfileMappingResponseType } from '../../dtos/profile-response.dto';

export abstract class IProfileMappingRepository {
  abstract create(userId: string, data: CreateProfileMappingDto): Promise<void>;
  abstract findByUserId(
    userId: string,
  ): Promise<ProfileMappingResponseType | null>;
}
