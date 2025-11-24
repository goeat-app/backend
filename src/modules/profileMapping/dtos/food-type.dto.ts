import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FoodTypeSchema = z.object({
  name: z.string(),
});

export class FoodTypeDto extends createZodDto(FoodTypeSchema) {}

export type FoodTypeType = z.infer<typeof FoodTypeSchema>;