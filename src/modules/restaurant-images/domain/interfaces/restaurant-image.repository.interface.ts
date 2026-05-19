export abstract class IRestaurantImageRepository {
  abstract create(data: {
    restaurant_id: string;
    image_key: string;
    is_cover: boolean;
  }): Promise<{
    id: string;
    restaurant_id: string;
    image_key: string;
    is_cover: boolean;
    created_at: Date;
  }>;

  abstract findByIdAndRestaurantId(
    imageId: string,
    restaurantId: string,
  ): Promise<{
    id: string;
    restaurant_id: string;
    image_key: string;
    is_cover: boolean;
    created_at: Date;
  } | null>;

  abstract deleteById(imageId: string): Promise<void>;
}
