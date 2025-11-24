import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { IFoodTypeRepository } from '../../domain/interfaces/food-type.interface';
import { FoodTypeDto } from '../../dtos/food-type.dto';

@Injectable()
export class FoodTypeUseCase {
    constructor(
        private readonly foodTypeRepository: IFoodTypeRepository
    ) { }

    async findByName(dto: FoodTypeDto) : Promise<FoodTypeDto> {

        if (!dto.name) throw new BadRequestException('Name is required');

        const foodType = await this.foodTypeRepository.findByName(dto.name);

        if (!foodType) throw new NotFoundException();

        return foodType;
    }

    async findAll() : Promise<FoodTypeDto[]> {
        return this.foodTypeRepository.findAll();
    }

    async create(dto: FoodTypeDto) : Promise<void> {
        const foodType = await this.foodTypeRepository.findByName(dto.name);

        if (foodType) throw new UnauthorizedException('Food type already exists');

        await this.foodTypeRepository.create(dto as any);
    }
}