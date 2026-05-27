import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AvailabilitySchema = z.enum(['available', 'unavailable']);

const ListMenuItemsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category_id: z.string().uuid().optional(),
  availability: AvailabilitySchema.optional(),
});

export class ListMenuItemsQueryDto extends createZodDto(
  ListMenuItemsQuerySchema,
) {}

export type ListMenuItemsQueryType = z.infer<typeof ListMenuItemsQuerySchema>;
