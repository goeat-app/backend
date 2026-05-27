import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ListMenuCategoriesQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export class ListMenuCategoriesQueryDto extends createZodDto(
  ListMenuCategoriesQuerySchema,
) {}

export type ListMenuCategoriesQueryType = z.infer<
  typeof ListMenuCategoriesQuerySchema
>;
