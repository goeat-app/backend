import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GenerateRecommendationsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().positive().max(50000).optional(),
});

export class GenerateRecommendationsDto extends createZodDto(
  GenerateRecommendationsSchema,
) {}

export type GenerateRecommendationsInput = z.infer<
  typeof GenerateRecommendationsSchema
>;
