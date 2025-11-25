import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
} from 'sequelize-typescript';

@Table({ tableName: 'place_types', timestamps: false })
export class PlaceTypeModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare tag_image: string;
}
