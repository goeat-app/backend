import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaceTypeDto } from '../../dtos/place-type.dto';
import { IPlaceTypeRepository } from '../../domain/interfaces/place-type.interface';
import { FoodTypeByNameDto } from '../../dtos/food-type.dto';

@Injectable()
export class PlaceTypeUseCase {
  constructor(private readonly placeTypeRepository: IPlaceTypeRepository) {}

  async getCategories(): Promise<PlaceTypeDto> {
    const response = await this.placeTypeRepository.findAll();

    if (!response) throw new NotFoundException('No place types found');

    const data = response.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
    }));

    return data;
  }

  async findByName(name: string): Promise<FoodTypeByNameDto> {
    if (!name) throw new BadRequestException(400, 'Name is required');

    const response = await this.placeTypeRepository.findByName(name);

    if (!response) throw new NotFoundException(404, 'Place type not found');

    const data = {
      ...response,
      slug: response.slug,
    };

    return data;
  }
}
