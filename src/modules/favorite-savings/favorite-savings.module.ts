import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FavoriteSavingsModel } from './infra/database/favorite-savings.model';
import { FavoriteSavingsController } from './infra/controllers/favorite-savings.controller';
import { FavoriteSavingsUseCase } from './app/use-cases/favorite-savings.use-case';
import { IFavoriteSavingsRepository } from './domain/interfaces/favorite-savings.interface';
import { SequelizeFavoriteSavingsRepository } from './infra/repositories/favorite-savings.repository';
import { RecommendationModule } from '../recommendation/recommendation.module';

@Module({
  imports: [
    SequelizeModule.forFeature([FavoriteSavingsModel]),
    RecommendationModule,
  ],
  controllers: [FavoriteSavingsController],
  providers: [
    FavoriteSavingsUseCase,
    {
      provide: IFavoriteSavingsRepository,
      useClass: SequelizeFavoriteSavingsRepository,
    },
  ],
  exports: [FavoriteSavingsUseCase, IFavoriteSavingsRepository],
})
export class FavoriteSavingsModule {}
