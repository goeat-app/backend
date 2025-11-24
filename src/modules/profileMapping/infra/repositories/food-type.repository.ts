import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FoodTypeModel } from "../database/food-type.model";
import { IFoodTypeRepository } from "../../domain/interfaces/food-type.interface";
import { FoodTypeDto } from "../../dtos/food-type.dto";
import th from "zod/v4/locales/th.js";


@Injectable()
export class SequelizeFoodTypeRepository implements IFoodTypeRepository {
    constructor(
        @InjectModel(FoodTypeModel)
        private readonly foodTypeModel: typeof FoodTypeModel,
    ) { }

    async create(data: FoodTypeDto): Promise<void> {
        try {
            await this.foodTypeModel.create({
                name: data?.name,
            });
        } catch (error) {
            throw new Error("Error creating food type.");
        }

    }
    async findAll(): Promise<FoodTypeDto[]> {
        try {
            const foodTypes = await this.foodTypeModel.findAll();
            return foodTypes;
        } catch (error) {
            throw new Error("Food types not found.");
        }

    }
    async findByName(name: string): Promise<FoodTypeDto | null> {

        try {
            const foodType = await this.foodTypeModel.findOne({
                where: { name },
            });
            return foodType ?? null;
        } catch (error) {
            throw new Error("Food type not found.");
        }

    }
}