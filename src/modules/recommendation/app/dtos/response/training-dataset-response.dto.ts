import { TrainingDataset } from '@/modules/recommendation/domain/interfaces/training-dataset.interface';

export interface TrainingDatasetResponseDto extends Omit<
  TrainingDataset,
  'createdAt'
> {
  createdAt: string;
}
