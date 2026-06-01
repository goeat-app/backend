import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';
import { UserModel } from '@/modules/auth/infra/database/user.model';
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { RestaurantRole } from '../../domain/enums/restaurant-role.enum';

@Table({
  tableName: 'restaurant_user_roles',
  timestamps: true,
  underscored: true,
})
export class RestaurantUserRoleModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => RestaurantsModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare restaurant_id: string;

  @BelongsTo(() => RestaurantsModel, 'restaurant_id')
  restaurant!: RestaurantsModel;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare user_id: string;

  @BelongsTo(() => UserModel, 'user_id')
  user!: UserModel;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare role: RestaurantRole;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
