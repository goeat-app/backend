import { IsArray, IsUUID } from 'class-validator';

export class SaveFavoriteSavingsDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  restaurantIds: string[];
}
