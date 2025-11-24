import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { PlaceTypeModel } from "../database/place-type.model";
import { IPlaceTypeRepository } from "../../domain/interfaces/place-type.interface";
import { PlaceTypeDto } from "../../dtos/place-type.dto";
import th from "zod/v4/locales/th.js";

@Injectable()
export class SequelizePlaceTypeRepository implements IPlaceTypeRepository {
    constructor(
        @InjectModel(PlaceTypeModel)
        private readonly placeTypeModel: typeof PlaceTypeModel,
    ) { }

    async create(data: PlaceTypeDto): Promise<void> {
        try {
            await this.placeTypeModel.create({
                name: data?.name,
            });
        } catch (error) {
            throw new Error("Error creating place type.");
        }

    }

    async findAll(): Promise<PlaceTypeDto[]> {
        try {
            const placeTypes = await this.placeTypeModel.findAll();
            return placeTypes;
        } catch (error) {
            throw new Error("Place types not found.");
        }

    }

    async findByName(name: string): Promise<PlaceTypeDto | null> {
        try {
            const placeType = await this.placeTypeModel.findOne({
                where: { name },
            });
            return placeType ?? null;
        } catch (error) {
            throw new Error("Place type not found.");
        }

    }
}