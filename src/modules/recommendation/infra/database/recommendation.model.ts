import {
  AllowNull,
  Column,
  DataType,
  Default,
  BelongsTo,
  HasMany,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { RecommendationSessionModel } from './recommendation-session.model';
import { RestaurantsModel } from './restaurant.model';
import { RecommendationInteractionModel } from './recommendation-interaction.model';
import { RecommendationFeedbackStateModel } from './recommendation-feedback-state.model';

@Table({ tableName: 'recommendations', timestamps: false })
export class RecommendationModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => RecommendationSessionModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare session_id: string;

  @BelongsTo(() => RecommendationSessionModel)
  session!: RecommendationSessionModel;

  @ForeignKey(() => RestaurantsModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare restaurant_id: string;

  @BelongsTo(() => RestaurantsModel)
  restaurant!: RestaurantsModel;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER })
  declare position: number;

  @AllowNull(false)
  @Column({ type: DataType.DECIMAL })
  declare score: number;

  @Default(false)
  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN })
  declare is_primary: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare score_breakdown: Record<string, number> | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @HasMany(() => RecommendationInteractionModel)
  interactions!: RecommendationInteractionModel[];

  @HasMany(() => RecommendationFeedbackStateModel)
  feedbackStates!: RecommendationFeedbackStateModel[];
}
