import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  CreatedAt,
} from 'sequelize-typescript';
import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';

@Table({ tableName: 'restaurant_images', timestamps: false })
export class RestaurantImageModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => RestaurantsModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare restaurant_id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare image_key: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  declare is_cover: boolean;

  @CreatedAt
  @Column({ field: 'created_at', type: DataType.DATE })
  declare created_at: Date;
}
