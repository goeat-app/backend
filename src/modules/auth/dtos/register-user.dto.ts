import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}

export type RegisterUserType = z.infer<typeof RegisterUserSchema>;
