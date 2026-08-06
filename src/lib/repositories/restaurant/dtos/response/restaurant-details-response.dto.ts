import { RestaurantResponseDto } from './restaurant-response.dto';

export interface RestaurantDetailsResponseDto extends RestaurantResponseDto {
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  photos: string[];
}
