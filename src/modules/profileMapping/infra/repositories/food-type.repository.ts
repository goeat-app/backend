import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FoodTypeModel } from '../database/food-type.model';
import { IFoodTypeRepository } from '../../domain/interfaces/food-type.interface';
import { FoodTypeDtoModel } from '../../domain/model/food-type.model';

@Injectable()
export class SequelizeFoodTypeRepository implements IFoodTypeRepository {
  constructor(
    @InjectModel(FoodTypeModel)
    private readonly foodTypeModel: typeof FoodTypeModel,
  ) {}

  async findAll(): Promise<FoodTypeDtoModel[]> {
    const foodTypes = await this.foodTypeModel.findAll();

    if (!foodTypes || foodTypes.length === 0) {
      throw new NotFoundException('No food types found in database.');
    }

    return foodTypes;
  }

  async findByName(name: string): Promise<FoodTypeDtoModel> {
    const foodType = await this.foodTypeModel.findOne({
      where: { name },
    });

    if (!foodType) {
      throw new NotFoundException(`Food type "${name}" not found.`);
    }

    return foodType as FoodTypeDtoModel;
  }
}
