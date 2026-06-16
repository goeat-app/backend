import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../../app/dtos/response/restaurant-recommendation-response.dto';
import { GetOnboardingRecommendationUseCase } from '../../app/use-cases/get-onboarding-recommendation.use-case';
import { GetMapRestaurantsUseCase } from '../../app/use-cases/get-map-restaurants.use-case';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UserModel } from '@/modules/auth/infra/database/user.model';

@Controller('recommender')
export class RecommendationController {
  constructor(
    private readonly getOnboardingRecommendationUseCase: GetOnboardingRecommendationUseCase,
    private readonly getMapRestaurantsUseCase: GetMapRestaurantsUseCase,
  ) {}

  @Get('map')
  @UseGuards(FirebaseAuthGuard)
  async getMapRestaurants(
    @Req() req: Request & { user: UserModel },
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('city') city?: string,
  ): Promise<RestaurantRecommendationResponseDto[]> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    return await this.getMapRestaurantsUseCase.execute(req.user.id, {
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
      radiusKm: radiusKm !== undefined ? Number(radiusKm) : undefined,
      city,
    });
  }

  @Get('onboarding')
  @UseGuards(FirebaseAuthGuard)
  async getRecommendationBasedOnboarding(
    @Query('userId') userId: string,
    @Req() req: Request & { user: UserModel },
  ): Promise<RestaurantRecommendationResponseDto[]> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    return await this.getOnboardingRecommendationUseCase.execute(req.user.id);
  }
}
