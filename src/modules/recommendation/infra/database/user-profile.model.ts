import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'user_profiles', timestamps: false })
export class UserProfileModel extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare id: string;

  @AllowNull(false)
  @Column({ type: DataType.UUID })
  declare user_id: string;

  @AllowNull(false)
  @Column({ type: DataType.STRING })
  declare profile_version: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare cuisine_affinities: Record<string, unknown> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare ambiance_affinities: Record<string, unknown> | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare budget_affinity: Record<string, unknown> | null;

  @AllowNull(false)
  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
