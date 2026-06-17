export type PlainReview = {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
};

interface FoodType {
  name?: string | null;
}

interface PlaceType {
  name?: string | null;
  slug?: string | null;
}

export type PlainRestaurant = {
  address: string;
  average_price: number;
  average_rating: number;
  city: string;
  description?: string | null;
  foodType?: FoodType;
  id: string;
  image_url?: string | null;
  is_active: boolean;
  latitude: number;
  longitude: number;
  name: string;
  phone?: string | null;
  placeType?: PlaceType;
  slug: string;
  state: string;
  whatsapp?: string | null;
};
