import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UserDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RestaurantDto {
  @IsInt()
  restaurantId: number;

  @IsString()
  name: string;

  @IsString()
  restaurantType: string;

  @IsNumber()
  averagePrice?: number;

  @IsNumber()
  @IsOptional()
  averageRating?: number;
}

export class ReviewDto {
  @IsInt()
  userId: number;

  @IsInt()
  restaurantId: number;

  @IsInt()
  rating: number;
}

export class RecommenderRequestDto {
  @IsInt()
  UserRequestId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  @IsOptional()
  Users?: UserDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantDto)
  Restaurant: RestaurantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  Review: ReviewDto[];
}

export class RecommenderResponseDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  restaurants: RestaurantDto[];
}
