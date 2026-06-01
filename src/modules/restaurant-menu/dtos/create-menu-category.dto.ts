import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMenuCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export class CreateMenuCategoryDto extends createZodDto(
  CreateMenuCategorySchema,
) {}

export type CreateMenuCategoryType = z.infer<typeof CreateMenuCategorySchema>;
