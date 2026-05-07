import { UserModel } from '@/modules/auth/infra/database/user.model';
import {
  AllowNull,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'favorite_savings', timestamps: true, underscored: true })
export class FavoriteSavingsModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column({ type: DataType.UUID, unique: true })
  declare user_id: string;

  @AllowNull(false)
  @Default([])
  @Column({ type: DataType.ARRAY(DataType.UUID) })
  declare favorite_restaurant_ids: string[];
}
