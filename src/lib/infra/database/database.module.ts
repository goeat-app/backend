import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-food-type.model';
import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';
import { ReviewModel } from '@/modules/ia/infra/database/review.model';


@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined in environment variables');
        }
        
        const url = new URL(databaseUrl);
        
        return {
          dialect: 'postgres',
          host: url.hostname,
          port: parseInt(url.port),
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1), // Remove leading '/'
          autoLoadModels: false,
          synchronize: false,
          logging: false,
          dialectOptions: 
            config.get<string>('NODE_ENV') === 'production'
              ? {
                  ssl: {
                    require: true,
                    rejectUnauthorized: false,
                  },
                }
              : {},
          models: [
            UserModel,
            FoodTypeModel,
            PlaceTypeModel,
            ProfileMappingModel,
            ProfileMappingPlaceTypeModel,
            ProfileMappingFoodTypeModel,
            RestaurantsModel,
            ReviewModel,
          ],
        };
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
