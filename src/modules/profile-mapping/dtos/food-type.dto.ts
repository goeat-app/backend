import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FoodTypeSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    image_url: z.string().nullable().optional(),
  }),
);

const FoodTypeByNameSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  image_url: z.string().nullable().optional(),
});

export class FoodTypeDto extends createZodDto(FoodTypeSchema) {}
export class FoodTypeByNameDto extends createZodDto(FoodTypeByNameSchema) {}
