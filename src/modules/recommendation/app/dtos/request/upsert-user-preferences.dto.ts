import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const normalizedText = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value) => value.toLowerCase().replace(/\s+/g, '_'));

const UpsertUserPreferencesSchema = z.object({
  favoriteCuisines: z.array(normalizedText).max(10).default([]),
  preferredAmbiance: z.array(normalizedText).max(10).default([]),
  budgetLevel: z.number().int().min(1).max(5).nullable().optional(),
});

export class UpsertUserPreferencesDto extends createZodDto(
  UpsertUserPreferencesSchema,
) {}

export type UpsertUserPreferencesBody = z.infer<
  typeof UpsertUserPreferencesSchema
>;
