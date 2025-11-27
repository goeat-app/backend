import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RestaurantPayloadSchema = z.object({
  restaurantId: z.string(),
  restaurantType: z.string(),
  averagePrice: z.number(),
});

const ReviewPayloadSchema = z.object({
  userId: z.string(),
  restaurantId: z.string(),
  rating: z.number(),
});

const RecommendationRequestPayloadSchema = z.object({
  preferredTypes: z.array(z.string()),
  maxPrice: z.number().int(),
  Restaurant: z.array(RestaurantPayloadSchema),
  Review: z.array(ReviewPayloadSchema),
});

export class RestaurantPayloadDto extends createZodDto(RestaurantPayloadSchema) {}

export class ReviewPayloadDto extends createZodDto(ReviewPayloadSchema) {}

export class RecommendationRequestPayloadDto extends createZodDto(
  RecommendationRequestPayloadSchema,
) {}
