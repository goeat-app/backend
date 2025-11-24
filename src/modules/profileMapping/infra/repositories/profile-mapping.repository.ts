import { HttpCode, Injectable, NotFoundException } from "@nestjs/common";
import { IProfileMappingRepository } from "../../domain/interfaces/profile-mapping.interface";
import { CreateProfileMappingDto } from "../../dtos/create-profile.dto";
import { InjectModel } from "@nestjs/sequelize";
import { ProfileMappingModel } from "../database/profile-mapping-model";

@Injectable()
export class SequelizeProfileMappingRepository implements IProfileMappingRepository {
    constructor(
        @InjectModel(ProfileMappingModel)
        private readonly profileMappingModel: typeof ProfileMappingModel,
    ) { }

    async create(data: CreateProfileMappingDto): Promise<void> {

        try {
            const profileMapping = await this.profileMappingModel.create({
                userId: data.userId,
                priceRange: data.priceRange
            });

            if (data.foodTypes?.length) {
                await profileMapping.$set('foodTypes', data.foodTypes.map(ft => ft.id));
            }
            if (data.placeTypes?.length) {
                await profileMapping.$set('placeTypes', data.placeTypes.map(ft => ft.id));
            }
        }
        catch (error) {
            throw new Error("Error creating profile mapping.");
        }
    };

    async findMapperProfileByUserId(userId: string) {
        try {
            const profileMapping = await this.profileMappingModel.findOne({
                where: { userId: userId }
            });

            console.log("profileMapping:", profileMapping);

            if (!profileMapping) throw new NotFoundException('Profile mapping not found');

            return profileMapping;
        } catch (error) {
            throw new Error("Error retrieving profile mapping.");
        }
    }

}