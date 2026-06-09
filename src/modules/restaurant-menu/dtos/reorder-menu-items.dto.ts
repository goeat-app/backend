import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReorderMenuItemsSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1),
  category_id: z.string().uuid().optional(),
});

export class ReorderMenuItemsDto extends createZodDto(ReorderMenuItemsSchema) {}

export type ReorderMenuItemsType = z.infer<typeof ReorderMenuItemsSchema>;
