import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  phone: z.string(),
});

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}

export type RegisterUserType = z.infer<typeof RegisterUserSchema>;
