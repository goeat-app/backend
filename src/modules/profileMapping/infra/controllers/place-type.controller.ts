import { Controller, Get, Query } from '@nestjs/common';
//import { JwtAuthGuard } from '@/modules/auth/infra/jwt/jwt-auth.guard';
import { PlaceTypeDto } from '../../dtos/place-type.dto';
import { PlaceTypeUseCase } from '../../app/use-cases/place-type.use-case';

@Controller('places')
export class PlaceTypeController {
  constructor(private readonly placeTypeUseCase: PlaceTypeUseCase) {}

  @Get('types')
  //@UseGuards(JwtAuthGuard)
  findAll(): Promise<PlaceTypeDto> {
    return this.placeTypeUseCase.getCategories();
  }

  @Get('by-name')
  //@UseGuards(JwtAuthGuard)
  findByName(@Query('name') name: string) {
    return this.placeTypeUseCase.findByName(name);
  }
}
