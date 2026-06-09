import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateMenuCategorySchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    sort_order: z.number().int().nonnegative().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateMenuCategoryDto extends createZodDto(
  UpdateMenuCategorySchema,
) {}

export type UpdateMenuCategoryType = z.infer<typeof UpdateMenuCategorySchema>;
