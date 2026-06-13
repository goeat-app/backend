import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '@/modules/auth/auth.module';
import { RecommendationModule } from '@/modules/recommendation/recommendation.module';
import { FavoriteSavingsModel } from './infra/database/favorite-savings.model';
import { FavoriteSavingsController } from './infra/controllers/favorite-savings.controller';
import { FavoriteSavingsUseCase } from './app/use-cases/favorite-savings.use-case';
import { IFavoriteSavingsRepository } from './domain/interfaces/favorite-savings.interface';
import { SequelizeFavoriteSavingsRepository } from './infra/repositories/favorite-savings.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([FavoriteSavingsModel]),
    AuthModule,
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
