import { RestaurantResponseDto } from '@/lib/repositories/restaurant/dtos/response/restaurant-response.dto';
import { RestaurantRepository } from '@/lib/repositories/restaurant/restaurant.repository';
import { RestaurantOnboardingMapper } from '@/modules/recommendation/app/mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantDetailsUseCase {
  constructor(private readonly restaurantRepository: RestaurantRepository) {}

  async execute(restaurantId: string): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    return RestaurantOnboardingMapper.toRestaurantResponseDto(restaurant);
  }
}
