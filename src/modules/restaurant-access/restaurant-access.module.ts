import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { RestaurantsModel } from '../ia/infra/database/restaurant.model';
import { RestaurantAccessService } from './app/services/restaurant-access.service';
import { IRestaurantUserRoleRepository } from './domain/interfaces/restaurant-user-role.repository.interface';
import { RestaurantRolesGuard } from './infra/auth/restaurant-roles.guard';
import { RestaurantUserRoleModel } from './infra/database/restaurant-user-role.model';
import { RestaurantAccessController } from './infra/controllers/restaurant-access.controller';
import { MyRestaurantsController } from './infra/controllers/my-restaurants.controller';
import { SequelizeRestaurantUserRoleRepository } from './infra/repositories/restaurant-user-role.repository';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([RestaurantUserRoleModel, RestaurantsModel]),
  ],
  controllers: [RestaurantAccessController, MyRestaurantsController],
  providers: [
    RestaurantAccessService,
    RestaurantRolesGuard,
    {
      provide: IRestaurantUserRoleRepository,
      useClass: SequelizeRestaurantUserRoleRepository,
    },
  ],
  exports: [RestaurantAccessService, RestaurantRolesGuard],
})
export class RestaurantAccessModule {}
