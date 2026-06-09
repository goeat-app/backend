import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateMenuItemAvailabilitySchema = z.object({
  is_available: z.boolean(),
});

export class UpdateMenuItemAvailabilityDto extends createZodDto(
  UpdateMenuItemAvailabilitySchema,
) {}

export type UpdateMenuItemAvailabilityType = z.infer<
  typeof UpdateMenuItemAvailabilitySchema
>;
