import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  IMlModelRepository,
  MlModelRecord,
  RegisterMlModelInput,
} from '@/modules/recommendation/domain/interfaces/repositories/ml-model-repository.interface';
import { MlModel } from '../../database/ml-model.model';

@Injectable()
export class MlModelRepository implements IMlModelRepository {
  constructor(
    @InjectModel(MlModel)
    private readonly mlModel: typeof MlModel,
  ) {}

  async register(input: RegisterMlModelInput): Promise<MlModelRecord> {
    const now = new Date();
    const [record] = await this.mlModel.findOrCreate({
      where: {
        model_name: input.modelName,
        version: input.version,
      },
      defaults: {
        model_name: input.modelName,
        version: input.version,
        feature_version: input.featureVersion,
        training_dataset_version: input.trainingDatasetVersion ?? null,
        metrics: input.metrics ?? null,
        artifact_uri: input.artifactUri ?? null,
        deployed_at: input.deployedAt ?? null,
        created_at: now,
      },
    });

    await record.update({
      feature_version: input.featureVersion,
      training_dataset_version: input.trainingDatasetVersion ?? null,
      metrics: input.metrics ?? null,
      artifact_uri: input.artifactUri ?? null,
      deployed_at: input.deployedAt ?? null,
    });

    return this.toRecord(record);
  }

  async findByVersion(version: string): Promise<MlModelRecord | null> {
    const record = await this.mlModel.findOne({ where: { version } });
    return record ? this.toRecord(record) : null;
  }

  private toRecord(record: MlModel): MlModelRecord {
    return {
      id: record.id,
      modelName: record.model_name,
      version: record.version,
      featureVersion: record.feature_version,
      trainingDatasetVersion: record.training_dataset_version,
      metrics: record.metrics,
      artifactUri: record.artifact_uri,
      deployedAt: record.deployed_at,
      createdAt: record.created_at,
    };
  }
}
