import {
  AllowNull,
  Column,
  DataType,
  Default,
  BelongsTo,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { RestaurantsModel } from './restaurant.model';

@Table({ tableName: 'restaurant_ratings', timestamps: false })
export class RestaurantRatingModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @ForeignKey(() => RestaurantsModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare restaurant_id: string;

  @BelongsTo(() => RestaurantsModel)
  restaurant!: RestaurantsModel;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER })
  declare rating: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
