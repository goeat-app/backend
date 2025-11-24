import { Column, DataType, ForeignKey, Model, Table, Default, PrimaryKey, BelongsTo } from 'sequelize-typescript';
import { ProfileMappingModel} from './profile-mapping-model';
import { FoodTypeModel } from './food-type.model';

@Table({ tableName: 'profile_mapping_food_type' })
export class ProfileMappingFoodTypeModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ProfileMappingModel)
  @Column(DataType.UUID)
  profileMappingId: string;

  @BelongsTo(() => ProfileMappingModel)
  profileMapping: ProfileMappingModel;

  @ForeignKey(() => FoodTypeModel)
  @Column(DataType.UUID)
  foodTypeId: string;

  @BelongsTo(() => FoodTypeModel)
  foodType: FoodTypeModel;
}