import { FoodTypeDto } from "../../dtos/food-type.dto";

export abstract class IFoodTypeRepository {
    abstract create(data: FoodTypeDto): Promise<void>;

    abstract findAll(): Promise<FoodTypeDto[]>;
    
    abstract findByName(name: string): Promise<FoodTypeDto | null>;
}   