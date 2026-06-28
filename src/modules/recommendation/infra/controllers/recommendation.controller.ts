import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../../app/dtos/response/restaurant-recommendation-response.dto';
import { GetOnboardingRecommendationUseCase } from '../../app/use-cases/get-onboarding-recommendation.use-case';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { SyncNearbyRestaurantsUseCase } from '../../app/use-cases/sync-nearby-restaurants.use-case';
import { PlacesProviderError } from '../../domain/errors/places-provider.error';
import { RestaurantsModel } from '../database/restaurant.model';

@Controller('recommender')
export class RecommendationController {
  constructor(
    private readonly getOnboardingRecommendationUseCase: GetOnboardingRecommendationUseCase,
    private readonly syncNearbyRestaurantsUseCase: SyncNearbyRestaurantsUseCase,
  ) {}

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

  @Get('nearby')
  @UseGuards(FirebaseAuthGuard)
  async syncNearbyRestaurants(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusMeters') radiusMeters = '5000',
    @Query('maxResultCount') maxResultCount = '20',
    @Req() req: Request & { user: UserModel },
  ): Promise<RestaurantsModel[]> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadius = Number(radiusMeters);
    const parsedMaxResultCount = Number(maxResultCount);

    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      !Number.isFinite(parsedRadius) ||
      !Number.isFinite(parsedMaxResultCount)
    ) {
      throw new BadRequestException('Invalid nearby search coordinates');
    }

    try {
      return await this.syncNearbyRestaurantsUseCase.execute({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        radiusMeters: parsedRadius,
        maxResultCount: parsedMaxResultCount,
      });
    } catch (error) {
      if (error instanceof PlacesProviderError) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }
}
