import { PlaceTypesDtoModel } from '../model/place-type.model';

export abstract class IPlaceTypeRepository {
  abstract findAll(): Promise<PlaceTypesDtoModel[]>;

  abstract findByName(name: string): Promise<PlaceTypesDtoModel>;
}
