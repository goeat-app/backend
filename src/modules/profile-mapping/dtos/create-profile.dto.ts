import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateProfileMappingSchema = z.object({
  userId: z.uuid(),
  foodTypes: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
      }),
    )
    .max(3),
  placeTypes: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
      }),
    )
    .max(3),
  priceRange: z.object({
    maxValue: z.number().min(1).max(1000),
    minValue: z.number().min(1).max(1000),
  }),
});

export class CreateProfileMappingDto extends createZodDto(
  CreateProfileMappingSchema,
) {}

export type CreateProfileMappingType = z.infer<
  typeof CreateProfileMappingSchema
>;
