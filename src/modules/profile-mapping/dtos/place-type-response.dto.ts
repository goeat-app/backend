import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PlaceTypeResponseSchema = z.object({
  name: z.string().optional(),
  id: z.uuid(),
});

export class PlaceTypeResponseDto extends createZodDto(PlaceTypeResponseSchema) {}

export type PlaceTypeResponseType = z.infer<typeof PlaceTypeResponseSchema>;

