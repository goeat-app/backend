import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { RecommendationModel } from './recommendation.model';

@Table({ tableName: 'recommendation_sessions', timestamps: false })
export class RecommendationSessionModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @AllowNull(false)
  @Column({ type: DataType.DECIMAL })
  declare latitude: number;

  @AllowNull(false)
  @Column({ type: DataType.DECIMAL })
  declare longitude: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER })
  declare radius_meters: number;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare strategy: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare model_version: string | null;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare feature_version: string;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER })
  declare candidate_count: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare config_snapshot: Record<string, unknown> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare fallback_reason: string | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare generated_at: Date;

  @HasMany(() => RecommendationModel)
  recommendations!: RecommendationModel[];
}
