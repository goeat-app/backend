import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { FoodTypeModel } from "./infra/database/food-type.model";
import { FoodTypeController } from "./infra/controllers/food-type.controller";
import { FoodTypeUseCase } from "./app/use-cases/food-type.use-case";
import { IFoodTypeRepository } from "./domain/interfaces/food-type.interface";
import { SequelizeFoodTypeRepository } from "./infra/repositories/food-type.repository";
import { JwtAuthGuard } from "../auth/infra/jwt/jwt-auth.guard";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../auth/infra/jwt/constants";
import { PassportModule } from "@nestjs/passport";
import { PlaceTypeModel } from "./infra/database/place-type.model";
import { PlaceTypeController } from "./infra/controllers/place-type.controller";
import { PlaceTypeUseCase } from "./app/use-cases/place-type.use-case";
import { IPlaceTypeRepository } from "./domain/interfaces/place-type.interface";
import { SequelizePlaceTypeRepository } from "./infra/repositories/place-type.repository";
import { ProfileMappingModel } from "./infra/database/profile-mapping-model";
import { ProfileMappingUseCase } from "./app/use-cases/profile-mapping.use-case";
import { IProfileMappingRepository } from "./domain/interfaces/profile-mapping.interface";
import { SequelizeProfileMappingRepository } from "./infra/repositories/profile-mapping.repository";
import { ProfileMappingController } from "./infra/controllers/profile-type.controller";
import { ProfileMappingPlaceTypeModel } from "./infra/database/profile-mapping-place-type.model";
import { ProfileMappingFoodTypeModel } from "./infra/database/profile-mapping-food-type.model";
import { SequelizeFoodTypeProfileMappingRepository } from "./infra/repositories/food-type-profile-mapping.repository";
import { IProfileMappingFoodTypeRepository } from "./domain/interfaces/profile-mapping-food-type.interface";    
import { IProfileMappingPlaceTypeRepository } from "./domain/interfaces/profile-mapping-place-type.interface";   
import { SequelizePlaceTypeProfileMappingRepository } from "./infra/repositories/place-type-profile-mapping.repository";    

@Module({
    imports: [
        SequelizeModule.forFeature([
            FoodTypeModel, 
            PlaceTypeModel, 
            ProfileMappingModel, 
            ProfileMappingPlaceTypeModel, 
            ProfileMappingFoodTypeModel]),
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret || 'default-secret-key',
            signOptions: { expiresIn: '3600s' },
        }),
    ],
    controllers: [
        FoodTypeController, 
        PlaceTypeController, 
        ProfileMappingController],
    providers: [
        FoodTypeUseCase,
        PlaceTypeUseCase,
        ProfileMappingUseCase,
        JwtAuthGuard,
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
        {
            provide: IProfileMappingFoodTypeRepository,
            useClass: SequelizeFoodTypeProfileMappingRepository,
        },
        {
            provide: IProfileMappingPlaceTypeRepository,
            useClass: SequelizePlaceTypeProfileMappingRepository,
        }
    ],
    exports: [
        IFoodTypeRepository, 
        FoodTypeUseCase,
        JwtAuthGuard,
        IPlaceTypeRepository, 
        PlaceTypeUseCase,
        IProfileMappingRepository, 
        ProfileMappingUseCase,
        IProfileMappingFoodTypeRepository, 
        ProfileMappingUseCase,
        IProfileMappingPlaceTypeRepository, 
        ProfileMappingUseCase,
    ],
})
export class ProfileMappingModule { }