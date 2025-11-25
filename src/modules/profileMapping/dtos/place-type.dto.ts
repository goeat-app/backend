import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PlaceTypeSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    tagImage: z.string(),
  }),
);

const PlaceTypeByNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagImage: z.string(),
});

export class PlaceTypeByNameDto extends createZodDto(PlaceTypeByNameSchema) {}

export class PlaceTypeDto extends createZodDto(PlaceTypeSchema) {}

export type PlaceTypeType = z.infer<typeof PlaceTypeSchema>;
