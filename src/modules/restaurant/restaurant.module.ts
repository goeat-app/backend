import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { RestaurantsModel } from '../recommendation/infra/database/restaurant.model';
import { RestaurantController } from './app/infra/controllers/restaurant.controller';
import { RestaurantDetailsUseCase } from './app/use-cases/restaurant-details.use-case';
import { RestaurantRepository } from '@/lib/repositories/restaurant/restaurant.repository';
import { RestaurantImageModel } from '../restaurant-images/infra/database/restaurant-image.model';
import { SequelizeRestaurantImageRepository } from '../restaurant-images/infra/repositories/restaurant-image.repository';
import { IRestaurantImageRepository } from '../restaurant-images/domain/interfaces/restaurant-image.repository.interface';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([RestaurantsModel, RestaurantImageModel]),
    AuthModule,
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantDetailsUseCase,
    RestaurantRepository,
    {
      provide: IRestaurantImageRepository,
      useClass: SequelizeRestaurantImageRepository,
    },
  ],
  exports: [RestaurantDetailsUseCase],
})
export class RestaurantModule {}
