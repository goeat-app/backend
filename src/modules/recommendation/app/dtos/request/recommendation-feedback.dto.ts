import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RecommendationInteractionType } from '@/modules/recommendation/domain/enums/recommendation-interaction-type.enum';

const RecommendationFeedbackSchema = z
  .object({
    type: z.nativeEnum(RecommendationInteractionType),
    rating: z.number().int().min(1).max(5).optional(),
  })
  .refine(
    (value) =>
      value.type !== RecommendationInteractionType.Rating ||
      value.rating !== undefined,
    {
      message: 'rating is required when type is RATING',
      path: ['rating'],
    },
  );

export class RecommendationFeedbackDto extends createZodDto(
  RecommendationFeedbackSchema,
) {}

export type RecommendationFeedbackBody = z.infer<
  typeof RecommendationFeedbackSchema
>;
