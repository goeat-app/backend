import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FoodTypeSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    tagImage: z.string(),
  }),
);

const FoodTypeByNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagImage: z.string(),
});

export class FoodTypeDto extends createZodDto(FoodTypeSchema) {}
export class FoodTypeByNameDto extends createZodDto(FoodTypeByNameSchema) {}
