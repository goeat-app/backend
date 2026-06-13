import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoriteSavingsUseCase } from '../../app/use-cases/favorite-savings.use-case';
import { SaveFavoriteSavingsDto } from '../../dtos/save-favorite-savings.dto';
import { FavoriteSavingsResponseDto } from '../../dtos/favorite-savings-response.dto';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';

@Controller('favorite-savings')
export class FavoriteSavingsController {
  constructor(
    private readonly favoriteSavingsUseCase: FavoriteSavingsUseCase,
  ) {}

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getByUserId(
    @Req() req: Request & { user: UserModel },
  ): Promise<FavoriteSavingsResponseDto> {
    const userIdFromToken = req.user.id;
    return await this.favoriteSavingsUseCase.getByUserId(userIdFromToken);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async save(
    @Body() dto: SaveFavoriteSavingsDto,
    @Req() req: Request & { user: UserModel },
  ): Promise<FavoriteSavingsResponseDto> {
    return await this.favoriteSavingsUseCase.save({
      userId: req.user.id,
      restaurantIds: dto.restaurantIds,
    });
  }

  @Delete(':userId/restaurants/:restaurantId')
  @UseGuards(FirebaseAuthGuard)
  async removeRestaurant(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Req() req: Request & { user: UserModel },
  ): Promise<FavoriteSavingsResponseDto> {
    return await this.favoriteSavingsUseCase.removeRestaurant(
      req.user.id,
      restaurantId,
    );
  }
}
