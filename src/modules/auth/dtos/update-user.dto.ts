import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;

export type UpdateUserProfileResponse = {
  name: string;
  email: string;
  phone?: string;
};
