import {
  ContextFeatureVector,
  RestaurantFeatureVector,
  UserFeatureVector,
} from './feature-store.interface';

export interface TrainingDatasetRow {
  userFeatures: UserFeatureVector;
  restaurantFeatures: RestaurantFeatureVector;
  contextFeatures: ContextFeatureVector;
  label: 0 | 1;
}

export interface TrainingDataset {
  datasetVersion: string;
  featureVersion: string;
  source: 'FIRST_PARTY' | 'EXTERNAL';
  createdAt: Date;
  rows: TrainingDatasetRow[];
}
