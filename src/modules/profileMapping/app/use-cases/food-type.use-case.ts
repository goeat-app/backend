import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IFoodTypeRepository } from '../../domain/interfaces/food-type.interface';
import { FoodTypeByNameDto, FoodTypeDto } from '../../dtos/food-type.dto';

@Injectable()
export class FoodTypeUseCase {
  constructor(private readonly foodTypeRepository: IFoodTypeRepository) {}

  async getCategories(): Promise<FoodTypeDto> {
    const response = await this.foodTypeRepository.findAll();

    if (!response) throw new NotFoundException('No food types found');

    const data = response.map((item) => ({
      id: item.id,
      name: item.name,
      tagImage: item.tag_image,
    }));

    return data;
  }

  async findByName(name: string): Promise<FoodTypeByNameDto> {
    if (!name) throw new BadRequestException(400, 'Name is required');

    const response = await this.foodTypeRepository.findByName(name);

    if (!response) throw new NotFoundException(404, 'Food type not found');

    const data = {
      ...response,
      tagImage: response.tag_image,
    };

    return data;
  }
}
