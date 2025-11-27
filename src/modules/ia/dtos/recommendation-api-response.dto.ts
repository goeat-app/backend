import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RecommendationApiResponseSchema = z.object({
  restaurants: z.array(
    z.object({
      restaurantId: z.string(),
    }),
  ),
});

export class RecommendationApiResponseDto extends createZodDto(
  RecommendationApiResponseSchema,
) {}

export type RecommendationApiResponse = z.infer<typeof RecommendationApiResponseSchema>;
