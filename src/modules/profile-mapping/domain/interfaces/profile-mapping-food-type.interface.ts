import { ProfileMappingFoodTypeModel } from '../../infra/database/profile-mapping-food-type.model';

export abstract class IProfileMappingFoodTypeRepository {
  abstract findMappingFoodTypes(
    profileMappingId: string,
  ): Promise<ProfileMappingFoodTypeModel[]>;
}
