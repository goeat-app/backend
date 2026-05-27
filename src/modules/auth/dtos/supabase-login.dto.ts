import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const SupabaseLoginSchema = z.object({
  accessToken: z.string().min(1),
});

export class SupabaseLoginDto extends createZodDto(SupabaseLoginSchema) {}

export type SupabaseLoginType = z.infer<typeof SupabaseLoginSchema>;
