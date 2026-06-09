import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMenuItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  base_price: z.number().nonnegative().nullable().optional(),
  has_sizes: z.boolean().optional(),
  is_available: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export class CreateMenuItemDto extends createZodDto(CreateMenuItemSchema) {}

export type CreateMenuItemType = z.infer<typeof CreateMenuItemSchema>;
