import { Controller, Get, Post, Body, HttpCode, Query } from '@nestjs/common';
import { FoodTypeDto } from '../../dtos/food-type.dto';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { FoodTypeUseCase } from '../../app/use-cases/food-type.use-case';

@Controller('food-type')
export class FoodTypeController {
  constructor(private readonly foodTypeUseCase: FoodTypeUseCase) {}

  @Get()
  //@UseGuards(JwtAuthGuard)
  findAll(){
    return this.foodTypeUseCase.findAll();
  }

  @Get('by-name')
  //@UseGuards(JwtAuthGuard)
  findByName(@Query('name') name: string) {
    return this.foodTypeUseCase.findByName({ name });
  }

  // Remover depois de testes - Popular a tabela de tipos de comida
  @Post()
  //@UseGuards(JwtAuthGuard)
  @HttpCode(201)
  create(@Body() data: FoodTypeDto): Promise<void> {
    return this.foodTypeUseCase.create(data);
  }
}