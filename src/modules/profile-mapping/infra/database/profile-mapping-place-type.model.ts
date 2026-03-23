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

@Table({ tableName: 'profile_mapping_place_type', underscored: true })
export class ProfileMappingPlaceTypeModel extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => ProfileMappingModel)
  @Column({ type: DataType.UUID, field: 'profile_mapping_id' })
  profileMappingId: string;

  @BelongsTo(() => ProfileMappingModel)
  profileMapping: ProfileMappingModel;

  @ForeignKey(() => PlaceTypeModel)
  @Column({ type: DataType.UUID, field: 'place_type_id' })
  placeTypeId: string;

  @BelongsTo(() => PlaceTypeModel)
  placeType: PlaceTypeModel;
}
