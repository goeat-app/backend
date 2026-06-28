import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'user_preferences', timestamps: false })
export class UserPreferenceModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @Default([])
  @AllowNull(false)
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  declare favorite_cuisines: string[];

  @Default([])
  @AllowNull(false)
  @Column({ type: DataType.ARRAY(DataType.STRING) })
  declare preferred_ambiance: string[];

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare budget_level: number | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
