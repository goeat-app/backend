import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { RestaurantAccessModule } from '../restaurant-access/restaurant-access.module';
import { RestaurantMenuService } from './app/services/restaurant-menu.service';
import { RestaurantMenuController } from './infra/controllers/restaurant-menu.controller';
import { MenuCategoryModel } from './infra/database/menu-category.model';
import { MenuItemModel } from './infra/database/menu-item.model';
import { MenuItemSizeModel } from './infra/database/menu-item-size.model';
import { IStorageService } from '@/lib/infra/external/storage.service.interface';
import { SupabaseStorageService } from '@/lib/infra/external/supabase-storage.service';
import { LocalDiskStorageService } from '@/lib/infra/external/local-storage.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    RestaurantAccessModule,
    SequelizeModule.forFeature([
      MenuCategoryModel,
      MenuItemModel,
      MenuItemSizeModel,
    ]),
  ],
  controllers: [RestaurantMenuController],
  providers: [
    RestaurantMenuService,
    {
      provide: IStorageService,
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        return nodeEnv === 'production'
          ? new SupabaseStorageService(configService)
          : new LocalDiskStorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
})
export class RestaurantMenuModule {}
