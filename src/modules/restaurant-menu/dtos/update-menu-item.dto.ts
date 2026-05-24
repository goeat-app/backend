import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateMenuItemSchema = z
  .object({
    category_id: z.string().uuid().optional(),
    description: z.string().nullable().optional(),
    base_price: z.number().nonnegative().nullable().optional(),
    has_sizes: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateMenuItemDto extends createZodDto(UpdateMenuItemSchema) {}

export type UpdateMenuItemType = z.infer<typeof UpdateMenuItemSchema>;
