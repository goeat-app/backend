import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { PlaceTypeDto } from '../../dtos/place-type.dto';
import { PlaceTypeUseCase } from '../../app/use-cases/place-type.use-case';

@Controller('place-type')
export class PlaceTypeController {
  constructor(private readonly placeTypeUseCase: PlaceTypeUseCase) {}

  @Get()
  //@UseGuards(JwtAuthGuard)
  findAll() {
    return this.placeTypeUseCase.findAll();
  }

  @Get('by-name')
  //@UseGuards(JwtAuthGuard)
  findByName(@Query('name') name: string) {
    return this.placeTypeUseCase.findByName({ name });
  }

  @Post()
  //@UseGuards(JwtAuthGuard)
  @HttpCode(201)
  create(@Body() data: PlaceTypeDto): Promise<void>  {
    return this.placeTypeUseCase.create(data);
  }
}