import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { RestaurantsModel } from '../recommendation/infra/database/restaurant.model';
import { RestaurantController } from './app/infra/controllers/restaurant.controller';
import { RestaurantDetailsUseCase } from './app/use-cases/restaurant-details.use-case';
import { IRestaurantRepository } from '../recommendation/domain/interfaces/repositories/restaurant-repository.interface';
import { SequelizeRestaurantUserRoleRepository } from '../restaurant-access/infra/repositories/restaurant-user-role.repository';
import { RestaurantRepository } from '@/lib/repositories/restaurant/restaurant.repository';

@Module({
  imports: [SequelizeModule.forFeature([RestaurantsModel]), AuthModule],
  controllers: [RestaurantController],
  providers: [RestaurantDetailsUseCase, RestaurantRepository],
  exports: [RestaurantDetailsUseCase],
})
export class RestaurantModule {}
