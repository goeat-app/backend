import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { RecommendationModel } from './recommendation.model';

@Table({ tableName: 'recommendation_interactions', timestamps: false })
export class RecommendationInteractionModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => RecommendationModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare recommendation_id: string;

  @BelongsTo(() => RecommendationModel)
  recommendation!: RecommendationModel;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare interaction_type: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare value: Record<string, unknown> | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare created_at: Date;
}
