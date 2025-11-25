import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ProfileMappingResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  priceRange: z.object({
    minValue: z.number(),
    maxValue: z.number(),
  }),
  foodTypes: z.array(
    z.object({
      id: z.uuid(),
    }),
  ),
  placeTypes: z.array(
    z.object({
      id: z.uuid(),
    }),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class ProfileMappingResponseDto extends createZodDto(
  ProfileMappingResponseSchema,
) {}

export type ProfileMappingResponseType = z.infer<
  typeof ProfileMappingResponseSchema
>;
