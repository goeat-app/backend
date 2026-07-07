import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '@/modules/auth/auth.module';

import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-food-type.model';
import { UserModel } from '@/modules/auth/infra/database/user.model';

import { IUserPreferenceRepository } from './domain/interfaces/repositories/user-preference-repository.interface';
import { IRecommendationService } from './domain/interfaces/services/recommendation-service.interface';

import { RestaurantRepository } from './infra/repositories/restaurants/restaurants.repository';
import { ReviewRepository } from './infra/repositories/reviews/reviews.repository';
import { UserPreferenceRepository } from './infra/repositories/user-preferences/user-preferences.repository';
import { RecommendationBasedOnboardingExternal } from './infra/external/recommendation-based-onboarding/recommendation-based-onboarding.external';

import { GetOnboardingRecommendationUseCase } from './app/use-cases/get-onboarding-recommendation.use-case';
import { GetMapRestaurantsUseCase } from './app/use-cases/get-map-restaurants.use-case';
import { SyncNearbyRestaurantsUseCase } from './app/use-cases/sync-nearby-restaurants.use-case';
import { RestaurantDiscoverySyncService } from './app/services/restaurant-discovery-sync.service';

import { RecommendationController } from './infra/controllers/recommendation.controller';
import { IRestaurantRepository } from './domain/interfaces/repositories/restaurant-repository.interface';
import { IReviewRepository } from './domain/interfaces/repositories/review-repository.interface';
import { PlacesProvider } from './domain/interfaces/places-provider.interface';
import { GooglePlacesProvider } from './infra/external/google-places/google-places.provider';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    SequelizeModule.forFeature([
      RestaurantsModel,
      ReviewModel,
      ProfileMappingModel,
      PlaceTypeModel,
      FoodTypeModel,
      ProfileMappingPlaceTypeModel,
      ProfileMappingFoodTypeModel,
      UserModel,
    ]),
  ],
  controllers: [RecommendationController],
  providers: [
    {
      provide: IRestaurantRepository,
      useClass: RestaurantRepository,
    },
    {
      provide: IReviewRepository,
      useClass: ReviewRepository,
    },
    {
      provide: IUserPreferenceRepository,
      useClass: UserPreferenceRepository,
    },
    {
      provide: IRecommendationService,
      useClass: RecommendationBasedOnboardingExternal,
    },
    {
      provide: PlacesProvider,
      useClass: GooglePlacesProvider,
    },
    RestaurantDiscoverySyncService,
    GetOnboardingRecommendationUseCase,
    GetMapRestaurantsUseCase,
    SyncNearbyRestaurantsUseCase,
  ],
  exports: [
    GetOnboardingRecommendationUseCase,
    GetMapRestaurantsUseCase,
    SyncNearbyRestaurantsUseCase,
    RestaurantDiscoverySyncService,
    IRestaurantRepository,
    IReviewRepository,
    IUserPreferenceRepository,
    PlacesProvider,
  ],
})
export class RecommendationModule {}
