import { Column, DataType, Default, Model, Table, PrimaryKey, AllowNull } from 'sequelize-typescript';

@Table({ tableName: 'food_types' })
export class FoodTypeModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;
}
