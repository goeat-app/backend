import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RestaurantRecommendationResponseDto } from '../../app/dtos/response/restaurant-recommendation-response.dto';
import { parseRestaurantQueryFilters } from '../../app/dtos/request/parse-restaurant-query-filters';
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

    try {
      return await this.getMapRestaurantsUseCase.execute(req.user.id, {
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        radiusKm: radiusKm !== undefined ? Number(radiusKm) : undefined,
        city,
      });
    } catch (error) {
      console.error('Recommendation Map Error:', error);
      throw new BadRequestException('Error processing recommendation request.');
    }
  }

  @Get('onboarding')
  @UseGuards(FirebaseAuthGuard)
  async getRecommendationBasedOnboarding(
    @Req() req: Request & { user: UserModel },
    @Query('minRating') minRating?: string,
    @Query('foodTypes') foodTypes?: string,
    @Query('restaurantStyles') restaurantStyles?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<RestaurantRecommendationResponseDto[]> {
    if (!req.user) {
      throw new BadRequestException('User not authenticated');
    }

    try {
      const sessionFilters = parseRestaurantQueryFilters({
        minRating,
        foodTypes,
        restaurantStyles,
        minPrice,
        maxPrice,
      });

      return await this.getOnboardingRecommendationUseCase.execute(
        req.user.id,
        sessionFilters,
      );
    } catch (error) {
      console.error('Recommendation Onboarding Error:', error);
      throw new BadRequestException('Error processing recommendation request.');
    }
  }
}
