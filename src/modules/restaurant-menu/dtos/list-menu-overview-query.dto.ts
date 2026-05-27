import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const AvailabilitySchema = z.enum(['available', 'unavailable']);

const ListMenuOverviewQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category_id: z.string().uuid().optional(),
  availability: AvailabilitySchema.optional(),
});

export class ListMenuOverviewQueryDto extends createZodDto(
  ListMenuOverviewQuerySchema,
) {}

export type ListMenuOverviewQueryType = z.infer<
  typeof ListMenuOverviewQuerySchema
>;
