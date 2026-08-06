import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '@/modules/auth/infra/firebase/firebase-auth.guard';
import { TrainingDatasetResponseDto } from '../../app/dtos/response/training-dataset-response.dto';
import { GenerateTrainingDatasetUseCase } from '../../app/use-cases/generate-training-dataset.use-case';

@Controller('recommendations/ml')
export class MlDatasetController {
  constructor(
    private readonly generateTrainingDatasetUseCase: GenerateTrainingDatasetUseCase,
  ) {}

  @Get('training-dataset')
  @UseGuards(FirebaseAuthGuard)
  async generateTrainingDataset(): Promise<TrainingDatasetResponseDto> {
    return this.generateTrainingDatasetUseCase.execute();
  }
}
