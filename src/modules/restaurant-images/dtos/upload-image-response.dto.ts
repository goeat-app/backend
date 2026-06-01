import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UploadImageResponseSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  image_key: z.string(),
  is_cover: z.boolean(),
  created_at: z.date(),
});

export class UploadImageResponseDto extends createZodDto(
  UploadImageResponseSchema,
) {}
