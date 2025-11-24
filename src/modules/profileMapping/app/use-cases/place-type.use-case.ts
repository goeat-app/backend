import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { PlaceTypeDto } from '../../dtos/place-type.dto';
import { IPlaceTypeRepository } from '../../domain/interfaces/place-type.interface';

@Injectable()
export class PlaceTypeUseCase {
  constructor(
    private readonly placeTypeRepository: IPlaceTypeRepository,
  ) { }

  async findByName(dto: PlaceTypeDto): Promise<PlaceTypeDto> {

    if (!dto.name) throw new BadGatewayException('Name is required');

    const placeType = await this.placeTypeRepository.findByName(dto.name);

    if (!placeType) throw new NotFoundException();

    return placeType;
  }

  async findAll(): Promise<PlaceTypeDto[]> {
    return this.placeTypeRepository.findAll();
  }

  async create(dto: PlaceTypeDto): Promise<void> {
    const placeType = await this.placeTypeRepository.findByName(dto.name);

    if (placeType) throw new BadGatewayException('Place type already exists');

    await this.placeTypeRepository.create(dto as any);
  }

}
