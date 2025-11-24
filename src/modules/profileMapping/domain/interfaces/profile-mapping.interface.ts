import { CreateProfileMappingDto } from "../../dtos/create-profile.dto";

export abstract class IProfileMappingRepository {
    abstract create(data: CreateProfileMappingDto): Promise<void>;
    abstract findMapperProfileByUserId(userId: string);
}   