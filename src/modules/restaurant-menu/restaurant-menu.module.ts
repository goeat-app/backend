import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { RestaurantAccessModule } from '../restaurant-access/restaurant-access.module';
import { RestaurantMenuService } from './app/services/restaurant-menu.service';
import { RestaurantMenuController } from './infra/controllers/restaurant-menu.controller';
import { MenuCategoryModel } from './infra/database/menu-category.model';
import { MenuItemModel } from './infra/database/menu-item.model';
import { MenuItemSizeModel } from './infra/database/menu-item-size.model';

@Module({
  imports: [
    AuthModule,
    RestaurantAccessModule,
    SequelizeModule.forFeature([
      MenuCategoryModel,
      MenuItemModel,
      MenuItemSizeModel,
    ]),
  ],
  controllers: [RestaurantMenuController],
  providers: [RestaurantMenuService],
})
export class RestaurantMenuModule {}
