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
import { MenuItemModel } from './menu-item.model';

@Table({
  tableName: 'menu_item_sizes',
  timestamps: true,
  underscored: true,
})
export class MenuItemSizeModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => MenuItemModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare menu_item_id: string;

  @BelongsTo(() => MenuItemModel, 'menu_item_id')
  menuItem!: MenuItemModel;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare label: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(10, 2))
  declare price: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sort_order: number;

  @Column(DataType.DATE)
  declare deleted_at: Date | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
