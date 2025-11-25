import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlaceTypeModel } from '../database/place-type.model';
import { IPlaceTypeRepository } from '../../domain/interfaces/place-type.interface';
import { PlaceTypesDtoModel } from '../../domain/model/place-type.model';

@Injectable()
export class SequelizePlaceTypeRepository implements IPlaceTypeRepository {
  constructor(
    @InjectModel(PlaceTypeModel)
    private readonly placeTypeModel: typeof PlaceTypeModel,
  ) {}

  async findAll(): Promise<PlaceTypesDtoModel[]> {
    const foodTypes = await this.placeTypeModel.findAll();

    if (!foodTypes || foodTypes.length === 0) {
      throw new NotFoundException('No place types found in database.');
    }

    return foodTypes;
  }

  async findByName(name: string): Promise<PlaceTypesDtoModel> {
    const foodType = await this.placeTypeModel.findOne({
      where: { name },
    });

    if (!foodType) {
      throw new NotFoundException(`Place type "${name}" not found`);
    }

    return foodType as PlaceTypesDtoModel;
  }
}
