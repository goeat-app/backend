import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
} from 'sequelize-typescript';

@Table({ tableName: 'restaurants', timestamps: false })
export class RestaurantsModel extends Model {
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
    allowNull: true,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare provider: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare provider_place_id: string | null;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  declare average_rating: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare total_reviews: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  declare average_price: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare primary_type: string | null;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  declare types: string[] | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare price_level: number | null;

  @Column({
    type: DataType.DECIMAL,
    allowNull: true,
  })
  declare google_rating: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare google_rating_count: number | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare business_status: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare open_now: boolean | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare website: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare phone: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare editorial_summary: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare editorial_summary_source: 'google' | 'generated' | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare first_seen_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare last_seen_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare last_synced_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare created_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare updated_at: Date | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare address: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare state: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare postal_code: string | null;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  declare latitude: number;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
  })
  declare longitude: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_active: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  declare image_url: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare whatsapp: string | null;
}
