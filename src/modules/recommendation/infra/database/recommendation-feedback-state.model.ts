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

@Table({ tableName: 'recommendation_feedback_state', timestamps: false })
export class RecommendationFeedbackStateModel extends Model {
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
  declare current_type: string;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
