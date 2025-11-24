import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  PrimaryKey,
  Default,
  BelongsTo,
} from 'sequelize-typescript';

import { ProfileMappingModel } from './profile-mapping-model';
import { PlaceTypeModel } from './place-type.model';

@Table({ tableName: 'profile_mapping_place_type' })
export class ProfileMappingPlaceTypeModel extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ProfileMappingModel)
  @Column(DataType.UUID)
  profileMappingId: string;

  @BelongsTo(() => ProfileMappingModel)
  profileMapping: ProfileMappingModel;

  @ForeignKey(() => PlaceTypeModel)
  @Column(DataType.UUID)
  placeTypeId: string;

  @BelongsTo(() => PlaceTypeModel)
  placeType: PlaceTypeModel;
}
