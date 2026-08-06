export interface RegisterMlModelInput {
  modelName: string;
  version: string;
  featureVersion: string;
  trainingDatasetVersion?: string;
  metrics?: Record<string, unknown>;
  artifactUri?: string;
  deployedAt?: Date | null;
}

export interface MlModelRecord {
  id: string;
  modelName: string;
  version: string;
  featureVersion: string;
  trainingDatasetVersion: string | null;
  metrics: Record<string, unknown> | null;
  artifactUri: string | null;
  deployedAt: Date | null;
  createdAt: Date;
}

export abstract class IMlModelRepository {
  abstract register(input: RegisterMlModelInput): Promise<MlModelRecord>;
  abstract findByVersion(version: string): Promise<MlModelRecord | null>;
}
