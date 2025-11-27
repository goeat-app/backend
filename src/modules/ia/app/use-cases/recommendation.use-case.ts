import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RecommendationBasedOnboardingDto } from '../../dtos/recommendation-based-onboarding.dto';
import { IIAService } from '../../domain/interfaces/ia.service.interface';
import { RestaurantRepository } from '../../infra/repositories/restaurant.repository';
import { ReviewRepository } from '../../infra/repositories/review.repository';
import { UserPreferenceRepository } from '../../infra/repositories/user-preference.repository';
import { RecommendationRequestPayloadDto } from '../../dtos/recommendation-request.dto';
import { getPriceLevel } from '@/lib/helpers/get-price-level.helper';
import { PlainRestaurant, PlainReview } from '../../domain/entities/recommendation.entity';


@Injectable()
export class RecommendationUseCase {
  constructor(
    private readonly iaService: IIAService,
    private readonly restaurantRepository: RestaurantRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly userPreferenceRepository: UserPreferenceRepository,
  ) {}

  async getRecommendationBasedOnboarding(userId: string): Promise<RecommendationBasedOnboardingDto> {
    try {
      const userPreferences = await this.userPreferenceRepository.findUserPreferencesByUserId(userId);

      const preferredTypes: string[] = userPreferences?.placeTypes?.map((pt: any) => pt.name) || [];
      const maxPrice: number = userPreferences ? Number(userPreferences.maxPrice) : 200;

      const restaurants = await this.restaurantRepository.findAllActiveRestaurants();

      const reviews = await this.reviewRepository.findAllReviews();

      const payload: RecommendationRequestPayloadDto = {
        preferredTypes,
        maxPrice,
        Restaurant: restaurants.map((restaurant) => {
          const plainRestaurant: PlainRestaurant = restaurant.get({ plain: true });
          return {
            restaurantId: plainRestaurant.id,
            restaurantType: plainRestaurant.placeType?.name || 'Unknown',
            averagePrice: Number(plainRestaurant.average_price),
          };
        }),
        Review: reviews.map((review) => {
          const plainReview: PlainReview = review.get({ plain: true });
          return {
            userId: plainReview.user_id,
            restaurantId: plainReview.restaurant_id,
            rating: Number(plainReview.rating),
          };
        }),
      };

      const response = await this.iaService.sendRecommendationBasedOnboarding(payload);

      if (!response || !response.restaurants || response.restaurants.length === 0) {
        const fallbackIds = restaurants.slice(0, 5).map(r => r.id);
        const recommendedRestaurants = await this.restaurantRepository.findByIds(fallbackIds);
        
        const data = recommendedRestaurants.map((restaurant) => {
          const plain: PlainRestaurant = restaurant.get({ plain: true });
          return {
            id: plain.id,
            name: plain.name,
            placeType: plain.placeType?.name || 'Unknown',
            tagImage: plain.placeType?.tag_image || '',
            foodType: plain.foodType?.name || 'Unknown',
            priceLevel: getPriceLevel(Number(plain.average_price)),
            avgRating: Number(plain.average_rating),
            address: plain.address,
            city: plain.city,
            state: plain.state,
          };
        });
        
        return data;
      }

      const recommendedRestaurantIds = response.restaurants.map((item) => item.restaurantId);

      const recommendedRestaurants = await this.restaurantRepository.findByIds(recommendedRestaurantIds);

      if (!recommendedRestaurants || recommendedRestaurants.length === 0) {
        throw new InternalServerErrorException('Recommended restaurants not found in database');
      }

      const data = recommendedRestaurants.map((restaurant) => {
        const plainRestaurant: PlainRestaurant = restaurant.get({ plain: true });
        return {
          id: plainRestaurant.id,
          name: plainRestaurant.name,
          placeType: plainRestaurant.placeType?.name || 'Unknown',
          tagImage: plainRestaurant.placeType?.tag_image || '',
          foodType: plainRestaurant.foodType?.name || 'Unknown',
          priceLevel: getPriceLevel(Number(plainRestaurant.average_price)),
          avgRating: Number(plainRestaurant.average_rating),
          address: plainRestaurant.address,
          city: plainRestaurant.city,
          state: plainRestaurant.state,
        };
      });

      return data;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to send recommendation request');
    }
  }
}

