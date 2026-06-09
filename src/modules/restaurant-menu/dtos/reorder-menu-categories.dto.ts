import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReorderMenuCategoriesSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export class ReorderMenuCategoriesDto extends createZodDto(
  ReorderMenuCategoriesSchema,
) {}

export type ReorderMenuCategoriesType = z.infer<
  typeof ReorderMenuCategoriesSchema
>;
