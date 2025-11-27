import { UserModel } from '@/modules/auth/infra/database/user.model';
import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
  ForeignKey,
} from 'sequelize-typescript';
import { RestaurantsModel } from './restaurant.model';

@Table({ tableName: 'reviews', timestamps: false })
export class ReviewModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column(DataType.UUID)
  declare user_id: string;

  @ForeignKey(() => RestaurantsModel)
  @Column(DataType.UUID)
  declare restaurant_id: string;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  declare rating: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare comment: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare visit_date: string;

}
