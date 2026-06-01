import { RestaurantsModel } from '@/modules/ia/infra/database/restaurant.model';
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
  HasMany,
} from 'sequelize-typescript';
import { MenuItemModel } from './menu-item.model';

@Table({
  tableName: 'menu_categories',
  timestamps: true,
  underscored: true,
})
export class MenuCategoryModel extends Model {
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

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare slug: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @Column(DataType.DATE)
  declare deleted_at: Date | null;

  @HasMany(() => MenuItemModel, 'category_id')
  items!: MenuItemModel[];

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
