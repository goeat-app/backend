
import { FoodTypeModel } from '@/modules/profile-mapping/infra/database/food-type.model';
import { PlaceTypeModel } from '@/modules/profile-mapping/infra/database/place-type.model';
import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
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


  @ForeignKey(() => PlaceTypeModel)
  @Column(DataType.UUID)
  declare place_type_id: string;

  @BelongsTo(() => PlaceTypeModel, 'place_type_id')
  placeType: PlaceTypeModel;

  @ForeignKey(() => FoodTypeModel)
  @Column(DataType.UUID)
  declare food_type_id: string;

  @BelongsTo(() => FoodTypeModel, 'food_type_id')
  foodType: FoodTypeModel;

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
    allowNull: false,
  })
  declare address: string;
 
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare state: string;

@Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare postal_code: string;

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
    type: DataType.TINYINT,
    allowNull: false,
  })
  declare is_active: number;

  

}
