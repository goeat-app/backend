export interface PlainRestaurant {
  id: string;
  name: string;
  place_type_id: string;
  food_type_id: string;
  average_rating: number;
  total_reviews: number;
  average_price: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  is_active: number;
  placeType?: {
    id: string;
    name: string;
    tag_image: string;
  };
  foodType?: {
    id: string;
    name: string;
    tag_image: string;
  };
}

export interface PlainReview {
  user_id: string;
  restaurant_id: string;
  rating: number;
}