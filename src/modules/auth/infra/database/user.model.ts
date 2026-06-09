import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'user',
  timestamps: true,
})
export class UserModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phone: string;

  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  declare latitude: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  declare longitude: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
    field: 'firebase_uid',
  })
  declare firebaseUid: string | null;
}
