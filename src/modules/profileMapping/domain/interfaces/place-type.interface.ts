import { PlaceTypeDto } from "../../dtos/place-type.dto";

export abstract class IPlaceTypeRepository {
    abstract create(data: PlaceTypeDto): Promise<void>;

    abstract findAll(): Promise<PlaceTypeDto[]>;
    
    abstract findByName(name: string): Promise<PlaceTypeDto | null>;
}   