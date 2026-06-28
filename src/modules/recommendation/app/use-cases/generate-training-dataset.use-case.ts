import { Injectable } from '@nestjs/common';
import { TrainingDatasetService } from '../services/training-dataset.service';
import { TrainingDatasetResponseDto } from '../dtos/response/training-dataset-response.dto';

@Injectable()
export class GenerateTrainingDatasetUseCase {
  constructor(
    private readonly trainingDatasetService: TrainingDatasetService,
  ) {}

  async execute(): Promise<TrainingDatasetResponseDto> {
    const dataset =
      await this.trainingDatasetService.generateFirstPartyDataset();

    return {
      ...dataset,
      createdAt: dataset.createdAt.toISOString(),
    };
  }
}
