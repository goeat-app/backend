import { Injectable } from '@nestjs/common';
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
    try {
      return await this.foodTypeModel.findAll();
    } catch (error) {
      throw new error('Food types not found.');
    }
  }
  async findByName(name: string): Promise<FoodTypeDtoModel> {
    try {
      const foodType = await this.foodTypeModel.findOne({
        where: { name },
      });

      return foodType as FoodTypeDtoModel;
    } catch (error) {
      throw new error('Food type not found.');
    }
  }
}
