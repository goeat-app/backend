import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import { ProfileMappingModel } from '@/modules/profile-mapping/infra/database/profile-mapping-model';
import { ProfileMappingPlaceTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-place-type.model';
import { ProfileMappingFoodTypeModel } from '@/modules/profile-mapping/infra/database/profile-mapping-food-type.model';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';
import { FavoriteSavingsModel } from '@/modules/favorite-savings/infra/database/favorite-savings.model';
import { RestaurantImageModel } from '@/modules/restaurant-images/infra/database/restaurant-image.model';
import { RestaurantUserRoleModel } from '@/modules/restaurant-access/infra/database/restaurant-user-role.model';
import { MenuCategoryModel } from '@/modules/restaurant-menu/infra/database/menu-category.model';
import { MenuItemModel } from '@/modules/restaurant-menu/infra/database/menu-item.model';
import { MenuItemSizeModel } from '@/modules/restaurant-menu/infra/database/menu-item-size.model';
import { RecommendationInteractionModel } from '@/modules/recommendation/infra/database/recommendation-interaction.model';
import { RecommendationFeedbackStateModel } from '@/modules/recommendation/infra/database/recommendation-feedback-state.model';
import { RecommendationModel } from '@/modules/recommendation/infra/database/recommendation.model';
import { RecommendationSessionModel } from '@/modules/recommendation/infra/database/recommendation-session.model';
import { RestaurantRatingModel } from '@/modules/recommendation/infra/database/restaurant-rating.model';
import { UserPreferenceModel } from '@/modules/recommendation/infra/database/user-preference.model';
import { UserProfileModel } from '@/modules/recommendation/infra/database/user-profile.model';
import { MlModel } from '@/modules/recommendation/infra/database/ml-model.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        if (!databaseUrl) {
          throw new Error(
            'DATABASE_URL is not defined in environment variables',
          );
        }

        const url = new URL(databaseUrl);

        return {
          dialect: 'postgres',
          host: url.hostname,
          port: parseInt(url.port),
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1),
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
                  family: 4,
                }
              : {
                  family: 4,
                },
          models: [
            UserModel,
            FoodTypeModel,
            PlaceTypeModel,
            ProfileMappingModel,
            ProfileMappingPlaceTypeModel,
            ProfileMappingFoodTypeModel,
            RestaurantsModel,
            ReviewModel,
            FavoriteSavingsModel,
            RestaurantImageModel,
            RestaurantUserRoleModel,
            MenuCategoryModel,
            MenuItemModel,
            MenuItemSizeModel,
            UserPreferenceModel,
            UserProfileModel,
            RecommendationSessionModel,
            RecommendationModel,
            RecommendationInteractionModel,
            RecommendationFeedbackStateModel,
            RestaurantRatingModel,
            MlModel,
          ],
        };
      },
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
