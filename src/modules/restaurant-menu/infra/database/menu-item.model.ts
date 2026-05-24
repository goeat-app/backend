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
import { MenuCategoryModel } from './menu-category.model';
import { MenuItemSizeModel } from './menu-item-size.model';

@Table({
  tableName: 'menu_items',
  timestamps: true,
  underscored: true,
})
export class MenuItemModel extends Model {
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

  @ForeignKey(() => MenuCategoryModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare category_id: string;

  @BelongsTo(() => MenuCategoryModel, 'category_id')
  category!: MenuCategoryModel;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.TEXT)
  declare description: string | null;

  @Column(DataType.DECIMAL(10, 2))
  declare base_price: number | null;

  @Column(DataType.STRING)
  declare image_key: string | null;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_available: boolean;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare has_sizes: boolean;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @Column(DataType.DATE)
  declare deleted_at: Date | null;

  @HasMany(() => MenuItemSizeModel, 'menu_item_id')
  sizes!: MenuItemSizeModel[];

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
