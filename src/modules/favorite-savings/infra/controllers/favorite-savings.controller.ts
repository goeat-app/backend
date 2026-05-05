import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { FavoriteSavingsUseCase } from '../../app/use-cases/favorite-savings.use-case';
import { SaveFavoriteSavingsDto } from '../../dtos/save-favorite-savings.dto';
import { FavoriteSavingsResponseDto } from '../../dtos/favorite-savings-response.dto';

@Controller('favorite-savings')
export class FavoriteSavingsController {
  constructor(
    private readonly favoriteSavingsUseCase: FavoriteSavingsUseCase,
  ) {}

  @Get(':userId')
  async getByUserId(
    @Param('userId') userId: string,
  ): Promise<FavoriteSavingsResponseDto> {
    return await this.favoriteSavingsUseCase.getByUserId(userId);
  }

  @Post()
  async save(
    @Body() dto: SaveFavoriteSavingsDto,
  ): Promise<FavoriteSavingsResponseDto> {
    return await this.favoriteSavingsUseCase.save(dto);
  }

  @Delete(':userId/restaurants/:restaurantId')
  async removeRestaurant(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
  ): Promise<FavoriteSavingsResponseDto> {
    return await this.favoriteSavingsUseCase.removeRestaurant(
      userId,
      restaurantId,
    );
  }
}
