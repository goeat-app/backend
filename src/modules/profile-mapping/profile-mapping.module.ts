import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { FoodTypeModel } from './infra/database/food-type.model';
import { FoodTypeController } from './infra/controllers/food-type.controller';
import { FoodTypeUseCase } from './app/use-cases/food-type.use-case';
import { IFoodTypeRepository } from './domain/interfaces/food-type.interface';
import { SequelizeFoodTypeRepository } from './infra/repositories/food-type.repository';
import { PlaceTypeModel } from './infra/database/place-type.model';
import { PlaceTypeController } from './infra/controllers/place-type.controller';
import { PlaceTypeUseCase } from './app/use-cases/place-type.use-case';
import { IPlaceTypeRepository } from './domain/interfaces/place-type.interface';
import { SequelizePlaceTypeRepository } from './infra/repositories/place-type.repository';
import { ProfileMappingModel } from './infra/database/profile-mapping-model';
import { ProfileMappingUseCase } from './app/use-cases/profile-mapping.use-case';
import { IProfileMappingRepository } from './domain/interfaces/profile-mapping.interface';
import { SequelizeProfileMappingRepository } from './infra/repositories/profile-mapping.repository';
import { ProfileMappingController } from './infra/controllers/profile-type.controller';
import { ProfileMappingPlaceTypeModel } from './infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from './infra/database/profile-mapping-food-type.model';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([
      FoodTypeModel,
      PlaceTypeModel,
      ProfileMappingModel,
      ProfileMappingPlaceTypeModel,
      ProfileMappingFoodTypeModel,
    ]),
  ],
  controllers: [
    FoodTypeController,
    PlaceTypeController,
    ProfileMappingController,
  ],
  providers: [
    FoodTypeUseCase,
    PlaceTypeUseCase,
    ProfileMappingUseCase,
    {
      provide: IFoodTypeRepository,
      useClass: SequelizeFoodTypeRepository,
    },
    {
      provide: IPlaceTypeRepository,
      useClass: SequelizePlaceTypeRepository,
    },
    {
      provide: IProfileMappingRepository,
      useClass: SequelizeProfileMappingRepository,
    },
  ],
  exports: [
    SequelizeModule,
    IFoodTypeRepository,
    FoodTypeUseCase,
    IPlaceTypeRepository,
    PlaceTypeUseCase,
    IProfileMappingRepository,
    ProfileMappingUseCase,
  ],
})
export class ProfileMappingModule {}
