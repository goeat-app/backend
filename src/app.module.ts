import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModel } from './modules/auth/infra/database/user.model';
import { ProfileMappingModule } from './modules/profileMapping/profile-mapping.module';
import { FoodTypeModel } from './modules/profileMapping/infra/database/food-type.model';
import { PlaceTypeModel } from './modules/profileMapping/infra/database/place-type.model';
import { ProfileMappingModel } from './modules/profileMapping/infra/database/profile-mapping-model';
import { ProfileMappingPlaceTypeModel } from './modules/profileMapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from './modules/profileMapping/infra/database/profile-mapping-food-type.model';  

@Module({
  imports: [
    AuthModule,
    ProfileMappingModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.HOST!,
      port: parseInt(process.env.PORT!),
      username: process.env.USER!,
      password: process.env.PASSWORD!,
      database: process.env.DATABASE!,
      autoLoadModels: false,
      synchronize: true,
      models: [
        UserModel,
        FoodTypeModel, 
        PlaceTypeModel, 
        ProfileMappingModel,
        ProfileMappingPlaceTypeModel, 
        ProfileMappingFoodTypeModel],
    }),
  ],
})
export class AppModule {}
