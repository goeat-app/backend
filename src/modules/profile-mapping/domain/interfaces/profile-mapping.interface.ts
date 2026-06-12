import { CreateProfileMappingDto } from '../../dtos/create-profile.dto';

export abstract class IProfileMappingRepository {
  abstract create(userId: string, data: CreateProfileMappingDto): Promise<void>;
}
