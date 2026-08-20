import { ReviewEntity } from '@/modules/recommendation/domain/entities/reviews.entity';
import {
  RecommendationServiceRequestDto,
  Restaurant,
  Review,
} from '@/modules/recommendation/app/dtos/request/recommendation-service-request.dto';
import { UserPreferenceEntity } from '@/modules/recommendation/domain/entities/user-preference.entity';
import { ReviewModel } from '@/modules/recommendation/infra/database/review.model';
import { RestaurantsModel } from '@/modules/recommendation/infra/database/restaurant.model';
import { RestaurantRecommendationResponseDto } from '../../dtos/response/restaurant-recommendation-response.dto';
import { RestaurantDetailsResponseDto } from '@/lib/repositories/restaurant/dtos/response/restaurant-details-response.dto';
import {
  PlainRestaurant,
  PlainReview,
} from '../types/map-onboarding-recommendation.types';
import { RestaurantEntity } from '@/lib/repositories/restaurant/domain/restaurant.entity';
import { normalizePhoneNumber } from '@/lib/helpers/normalize-phone-number.helper';

export class RestaurantOnboardingMapper {
  static toReviewEntity(review: ReviewModel): ReviewEntity {
    const plain = review.get({ plain: true }) as PlainReview;

    return new ReviewEntity(
      plain.id,
      plain.user_id,
      plain.restaurant_id,
      Number(plain.rating),
    );
  }

  static toRestaurantEntity(restaurant: RestaurantsModel): RestaurantEntity {
    const plain = restaurant.get({ plain: true }) as PlainRestaurant;

    return new RestaurantEntity(
      plain.address,
      Number(plain.average_price),
      Number(plain.average_rating),
      plain.city,
      plain.description ?? null,
      plain.foodType?.name ?? '',
      plain.id,
      Boolean(plain.is_active),
      Number(plain.latitude),
      Number(plain.longitude),
      plain.name,
      normalizePhoneNumber(plain.phone ?? null),
      plain.placeType?.name ?? '',
      plain.placeType?.slug ?? '',
      plain.state,
      plain.slug,
      plain.image_url ?? null,
      normalizePhoneNumber(plain.whatsapp ?? null),
    );
  }

  static toServiceRestaurant(
    entity: RestaurantEntity,
    _preferredTypes: string[],
  ): Restaurant {
    return {
      restaurantId: entity.id,
      restaurantType: entity.placeType,
      averagePrice: entity.averagePrice,
    };
  }

  static toServiceReview(entity: ReviewEntity): Review {
    return {
      userId: entity.userId,
      restaurantId: entity.restaurantId,
      rating: entity.rating,
    };
  }

  static toServiceRequest(
    restaurants: RestaurantsModel[],
    reviews: ReviewModel[],
    preferences: UserPreferenceEntity,
  ): RecommendationServiceRequestDto {
    const restaurantEntities = restaurants.map((restaurant) =>
      this.toRestaurantEntity(restaurant),
    );
    const reviewEntities = reviews.map((review) => this.toReviewEntity(review));

    return {
      restaurants: restaurantEntities.map((restaurant) =>
        this.toServiceRestaurant(
          restaurant,
          preferences.preferredPlaceTypes ?? [],
        ),
      ),
      reviews: reviewEntities.map((review) => this.toServiceReview(review)),
      preferredTypes: preferences.preferredPlaceTypes,
      maxPrice: Number(preferences.maxPrice),
    };
  }

  static toResponseDto(
    restaurants: RestaurantsModel[],
  ): RestaurantRecommendationResponseDto[] {
    const restaurantEntities = restaurants.map((restaurant) =>
      this.toRestaurantEntity(restaurant),
    );

    return restaurantEntities.map((restaurant) => {
      return {
        address: restaurant.address,
        averagePrice: restaurant.averagePrice,
        avgRating: restaurant.averageRating,
        city: restaurant.city,
        foodType: restaurant.foodType,
        id: restaurant.id,
        imageUrl: restaurant.imageUrl,
        isActive: restaurant.isActive,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        name: restaurant.name,
        placeType: restaurant.placeType,
        priceLevel: restaurant.priceLevel,
        slug: restaurant.placeTypeSlug,
        restaurantSlug: restaurant.restaurantSlug,
        state: restaurant.state,
      };
    });
  }

  static toRestaurantResponseDto(
    restaurant: RestaurantsModel,
  ): RestaurantRecommendationResponseDto {
    const restaurantEntities = this.toRestaurantEntity(restaurant);

    return {
      address: restaurantEntities.address,
      averagePrice: restaurantEntities.averagePrice,
      avgRating: restaurantEntities.averageRating,
      city: restaurantEntities.city,
      foodType: restaurantEntities.foodType,
      id: restaurantEntities.id,
      imageUrl: restaurantEntities.imageUrl,
      isActive: restaurantEntities.isActive,
      latitude: restaurantEntities.latitude,
      longitude: restaurantEntities.longitude,
      name: restaurantEntities.name,
      placeType: restaurantEntities.placeType,
      priceLevel: restaurantEntities.priceLevel,
      slug: restaurantEntities.placeTypeSlug,
      restaurantSlug: restaurantEntities.restaurantSlug,
      state: restaurantEntities.state,
    };
  }

  static toRestaurantDetailsResponseDto(
    restaurant: RestaurantsModel,
    mainImage: string | null,
    photos: string[] = [],
  ): RestaurantDetailsResponseDto {
    const entity = this.toRestaurantEntity(restaurant);

    return {
      address: entity.address,
      averagePrice: entity.averagePrice,
      avgRating: entity.averageRating,
      city: entity.city,
      description: entity.description,
      foodType: entity.foodType,
      id: entity.id,
      isActive: entity.isActive,
      latitude: entity.latitude,
      longitude: entity.longitude,
      name: entity.name,
      phone: entity.phone,
      photos,
      placeType: entity.placeType,
      priceLevel: entity.priceLevel,
      slug: entity.placeTypeSlug,
      restaurantSlug: entity.restaurantSlug,
      state: entity.state,
      whatsapp: entity.whatsapp,
      imageUrl: mainImage,
    };
  }
}
