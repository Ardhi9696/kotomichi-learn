import { z } from 'zod';

import { CONTENT_TYPES, LEVELS } from '@/features/catalog/types';

export const SESSION_ITEM_COUNTS = [5, 10, 20, 30] as const;

const levelSchema = z.enum(LEVELS);
const contentTypeSchema = z.enum(CONTENT_TYPES);

export const createLearningSessionSchema = z.object({
  level: levelSchema,
  contentTypes: z.array(contentTypeSchema).min(1).max(CONTENT_TYPES.length),
  itemCount: z.coerce
    .number()
    .int()
    .refine(
      (value) => SESSION_ITEM_COUNTS.some((itemCount) => itemCount === value),
      'Pilih jumlah item yang tersedia.',
    ),
});

export const learningSessionIdSchema = z.uuid();
export const sessionItemPositionSchema = z.number().int().nonnegative();

export type CreateLearningSessionInput = z.infer<typeof createLearningSessionSchema>;
