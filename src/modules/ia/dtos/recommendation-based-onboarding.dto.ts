import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RecommendationBasedOnboardingSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    placeType: z.string(),
    slug: z.string(),
    restaurantSlug: z.string(),
    foodType: z.string(),
    priceLevel: z.number().int().min(1).max(5),
    avgRating: z.number(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    averagePrice: z.number(),
    isActive: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
    imageUrl: z.string().nullable(),
  }),
);

export class RecommendationBasedOnboardingDto extends createZodDto(
  RecommendationBasedOnboardingSchema,
) {}

export type RecommendationBasedOnboardinType = z.infer<
  typeof RecommendationBasedOnboardingDto
>;
