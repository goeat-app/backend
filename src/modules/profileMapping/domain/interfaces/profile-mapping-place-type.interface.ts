import { ProfileMappingPlaceTypeModel } from '../../infra/database/profile-mapping-place-type.model';   

export abstract class IProfileMappingPlaceTypeRepository {
    abstract findMappingPlaceTypes(profileMappingId: string): Promise<ProfileMappingPlaceTypeModel[]>;
}