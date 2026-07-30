import { RestaurantDetailsResponseDto } from '@/lib/repositories/restaurant/dtos/response/restaurant-details-response.dto';
import { normalizePhoneNumber } from '@/lib/helpers/normalize-phone-number.helper';
import { RestaurantImageUrlResolver } from '@/lib/helpers/resolve-restaurant-image-url.helper';
import { RestaurantRepository } from '@/lib/repositories/restaurant/restaurant.repository';
import { RestaurantOnboardingMapper } from '@/modules/recommendation/app/mappers/map-onboarding-recommendation/map-onboarding-recommendation';
import { IRestaurantImageRepository } from '@/modules/restaurant-images/domain/interfaces/restaurant-image.repository.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantDetailsUseCase {
  constructor(
    private readonly restaurantRepository: RestaurantRepository,
    @Inject(IRestaurantImageRepository)
    private readonly restaurantImageRepository: IRestaurantImageRepository,
    private readonly imageUrlResolver: RestaurantImageUrlResolver,
  ) {}

  async execute(restaurantId: string): Promise<RestaurantDetailsResponseDto> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    const images =
      await this.restaurantImageRepository.findByRestaurantId(restaurantId);

    // Resolve image URLs asynchronously
    const photos = await Promise.all(
      images.map((image) => this.imageUrlResolver.resolve(image.image_key)),
    );

    return RestaurantOnboardingMapper.toRestaurantDetailsResponseDto(
      restaurant,
      photos,
    );
  }
}
