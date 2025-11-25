import { Controller, Get, Query } from '@nestjs/common';
import { FoodTypeDto } from '../../dtos/food-type.dto';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { FoodTypeUseCase } from '../../app/use-cases/food-type.use-case';

@Controller('food')
export class FoodTypeController {
  constructor(private readonly foodTypeUseCase: FoodTypeUseCase) {}

  @Get('categories')
  //@UseGuards(JwtAuthGuard)
  findAll(): Promise<FoodTypeDto> {
    return this.foodTypeUseCase.getCategories();
  }

  @Get('by-name')
  //@UseGuards(JwtAuthGuard)
  findByName(@Query('name') name: string) {
    return this.foodTypeUseCase.findByName(name);
  }
}
