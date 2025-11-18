import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginUserSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export class LoginUserDto extends createZodDto(LoginUserSchema) {}

export type LoginUserType = z.infer<typeof LoginUserDto>;
