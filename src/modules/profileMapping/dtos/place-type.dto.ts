import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PlaceTypeSchema = z.object({
  name: z.string(),
});

export class PlaceTypeDto extends createZodDto(PlaceTypeSchema) {}

export type PlaceTypeType = z.infer<typeof PlaceTypeSchema>;

