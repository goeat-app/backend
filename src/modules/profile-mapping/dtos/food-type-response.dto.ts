import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FoodTypeResponseSchema = z.object({
  name: z.string().optional(),
  id: z.uuid(),
});

export class FoodTypeResponseDto extends createZodDto(FoodTypeResponseSchema) {}

export type FoodTypeResponseType = z.infer<typeof FoodTypeResponseSchema>;