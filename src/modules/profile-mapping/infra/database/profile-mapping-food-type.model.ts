import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  Default,
  PrimaryKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ProfileMappingModel } from './profile-mapping-model';
import { FoodTypeModel } from './food-type.model';

@Table({ tableName: 'profile_mapping_food_type', underscored: true })
export class ProfileMappingFoodTypeModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ProfileMappingModel)
  @Column({ type: DataType.UUID, field: 'profile_mapping_id' })
  profileMappingId: string;

  @BelongsTo(() => ProfileMappingModel)
  profileMapping: ProfileMappingModel;

  @ForeignKey(() => FoodTypeModel)
  @Column({ type: DataType.UUID, field: 'food_type_id' })
  foodTypeId: string;

  @BelongsTo(() => FoodTypeModel)
  foodType: FoodTypeModel;
}
