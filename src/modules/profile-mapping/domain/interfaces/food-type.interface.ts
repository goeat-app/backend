import { FoodTypeDtoModel } from '../model/food-type.model';

export abstract class IFoodTypeRepository {
  abstract findAll(): Promise<FoodTypeDtoModel[]>;

  abstract findByName(name: string): Promise<FoodTypeDtoModel>;
}
