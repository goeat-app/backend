import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileMappingModule } from './modules/profile-mapping/profile-mapping.module';
import { IaModule } from './modules/ia/ia.module';
import { DatabaseModule } from './lib/infra/database/database.module';
import { FavoriteSavingsModule } from './modules/favorite-savings/favorite-savings.module';
import { RestaurantImagesModule } from './modules/restaurant-images/restaurant-images.module';
import { RestaurantAccessModule } from './modules/restaurant-access/restaurant-access.module';
import { RestaurantMenuModule } from './modules/restaurant-menu/restaurant-menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProfileMappingModule,
    IaModule,
    FavoriteSavingsModule,
    RestaurantImagesModule,
    RestaurantAccessModule,
    RestaurantMenuModule,
  ],
})
export class AppModule {}
