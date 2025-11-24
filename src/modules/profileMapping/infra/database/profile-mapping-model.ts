import { Column, DataType, Default, Model, Table, PrimaryKey } from 'sequelize-typescript';
import { ForeignKey, BelongsToMany, BelongsTo } from 'sequelize-typescript';
import { UserModel } from "../../../auth/infra/database/user.model";
import { FoodTypeModel } from "./food-type.model";
import { PlaceTypeModel } from "./place-type.model";
import { ProfileMappingFoodTypeModel } from "./profile-mapping-food-type.model";
import { ProfileMappingPlaceTypeModel } from "./profile-mapping-place-type.model";

@Table({ tableName: 'profile_mapping' })
export class ProfileMappingModel extends Model {

  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  priceRange: { minValue: number; maxValue: number };

  @BelongsToMany(() => FoodTypeModel, () => ProfileMappingFoodTypeModel)
  foodTypes: ProfileMappingFoodTypeModel[];

  @BelongsToMany(() => PlaceTypeModel, () => ProfileMappingPlaceTypeModel)
  placeTypes: ProfileMappingPlaceTypeModel[];
}
