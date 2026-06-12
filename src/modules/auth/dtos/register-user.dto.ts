import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}

export type RegisterUserType = z.infer<typeof RegisterUserSchema>;
