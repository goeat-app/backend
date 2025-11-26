import { Module } from '@nestjs/common';
import { IaService } from './app/services/ia.service';
import { SendRecommendationUseCase } from './app/use-cases/send-recommendation.use-case';
import { IaController } from './infra/controllers/ia.controller';

@Module({
  imports: [],
  controllers: [IaController],
  providers: [IaService, SendRecommendationUseCase],
  exports: [IaService],
})
export class IaModule {}
