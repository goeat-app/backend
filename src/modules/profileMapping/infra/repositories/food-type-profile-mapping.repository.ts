import { Injectable } from "@nestjs/common";
import { IProfileMappingFoodTypeRepository } from "../../domain/interfaces/profile-mapping-food-type.interface";
import { InjectModel } from "@nestjs/sequelize";
import { ProfileMappingFoodTypeModel } from "../database/profile-mapping-food-type.model";

@Injectable()
export class SequelizeFoodTypeProfileMappingRepository implements IProfileMappingFoodTypeRepository {
    constructor(
        @InjectModel(ProfileMappingFoodTypeModel)
        private readonly profileMappingFoodTypeModel: typeof ProfileMappingFoodTypeModel,
    ) { }

    async findMappingFoodTypes(profileMappingId: string): Promise<ProfileMappingFoodTypeModel[]> {
        try {
            const foodTypesMapping = await this.profileMappingFoodTypeModel.findAll({
                where: { profileMappingId },
            });
            return foodTypesMapping;
        } catch (error) {
            throw new Error("Mapping food types not found.");
        }

    }
}