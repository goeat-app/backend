import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantDetailsUseCase } from '../../use-cases/restaurant-details.use-case';

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantDetails: RestaurantDetailsUseCase) {}

  @Get('details')
  @UseGuards(FirebaseAuthGuard)
  async getRestaurantDetails(
    @Req() req: Request & { user: UserModel },
    @Query('id') id: string,
  ) {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    if (!id) {
      throw new BadRequestException('Restaurant id is required');
    }

    return this.restaurantDetails.execute(id);
  }
}
