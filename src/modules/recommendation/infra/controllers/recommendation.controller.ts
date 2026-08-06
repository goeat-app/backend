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
import { parseRestaurantQueryFilters } from '../../app/dtos/request/parse-restaurant-query-filters';
import { GetOnboardingRecommendationUseCase } from '../../app/use-cases/get-onboarding-recommendation.use-case';
import { GetMapRestaurantsUseCase } from '../../app/use-cases/get-map-restaurants.use-case';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { SyncNearbyRestaurantsUseCase } from '../../app/use-cases/sync-nearby-restaurants.use-case';
import { PlacesProviderError } from '../../domain/errors/places-provider.error';
import { NearbyRestaurantsResponseDto } from '../../app/dtos/response/nearby-restaurants-response.dto';

@Controller('recommender')
export class RecommendationController {
  constructor(
    private readonly getOnboardingRecommendationUseCase: GetOnboardingRecommendationUseCase,
    private readonly getMapRestaurantsUseCase: GetMapRestaurantsUseCase,
    private readonly syncNearbyRestaurantsUseCase: SyncNearbyRestaurantsUseCase,
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

  @Get('nearby')
  @UseGuards(FirebaseAuthGuard)
  async syncNearbyRestaurants(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusMeters') radiusMeters = '5000',
    @Query('maxResultCount') maxResultCount = '20',
    @Req() req: Request & { user: UserModel },
  ): Promise<NearbyRestaurantsResponseDto[]> {
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
      const restaurants = await this.syncNearbyRestaurantsUseCase.execute({
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        radiusMeters: parsedRadius,
        maxResultCount: parsedMaxResultCount,
      });

      return restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        provider: restaurant.provider,
        providerPlaceId: restaurant.provider_place_id,
        primaryType: restaurant.primary_type,
        types: restaurant.types,
        priceLevel: restaurant.price_level,
        googleRating: restaurant.google_rating,
        googleRatingCount: restaurant.google_rating_count,
        businessStatus: restaurant.business_status,
        openNow: restaurant.open_now,
        website: restaurant.website,
        phone: restaurant.phone,
        description: restaurant.description,
        editorialSummary: restaurant.editorial_summary,
        editorialSummarySource: restaurant.editorial_summary_source,
        city: restaurant.city,
        state: restaurant.state,
        postalCode: restaurant.postal_code,
        latitude: Number(restaurant.latitude),
        longitude: Number(restaurant.longitude),
        isActive: restaurant.is_active,
      }));
    } catch (error) {
      if (error instanceof PlacesProviderError) {
        throw new InternalServerErrorException(error.message);
      }

      throw error;
    }
  }
}
