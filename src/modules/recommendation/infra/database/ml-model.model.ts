import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'ml_models', timestamps: false })
export class MlModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare model_name: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare version: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare feature_version: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare training_dataset_version: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metrics: Record<string, unknown> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare artifact_uri: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deployed_at: Date | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare created_at: Date;
}
