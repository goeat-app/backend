import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IAExternal } from './infra/external/ia.external';
import { RecommendationUseCase } from './app/use-cases/recommendation.use-case';
import { IaController } from './infra/controllers/ia.controller';
import { RestaurantRepository } from './infra/repositories/restaurant.repository';
import { ReviewRepository } from './infra/repositories/review.repository';
import { UserPreferenceRepository } from './infra/repositories/user-preference.repository';
import { RestaurantsModel } from './infra/database/restaurant.model';
import { ReviewModel } from './infra/database/review.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-food-type.model';
import { IIAService } from './domain/interfaces/ia.service.interface';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RestaurantsModel,
      ReviewModel,
      ProfileMappingModel,
      PlaceTypeModel,
      FoodTypeModel,
      ProfileMappingPlaceTypeModel,
      ProfileMappingFoodTypeModel,
    ]),
  ],
  controllers: [IaController],
  providers: [
    {
      provide: IIAService,
      useClass: IAExternal,
    },
    RecommendationUseCase,
    RestaurantRepository,
    ReviewRepository,
    UserPreferenceRepository,
  ],
  exports: [RecommendationUseCase],
})
export class IaModule {}
