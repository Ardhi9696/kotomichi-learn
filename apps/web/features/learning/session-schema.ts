import { z } from 'zod';

import {
  CONTENT_TYPES,
  LEVELS,
  VOCABULARY_ADJECTIVE_TYPES,
  VOCABULARY_PARTS_OF_SPEECH,
  VOCABULARY_THEMES,
  VOCABULARY_TRANSITIVITIES,
  VOCABULARY_VERB_GROUPS,
} from '@/features/catalog/types';

export const SESSION_ITEM_COUNTS = [5, 10, 20, 30] as const;

const levelSchema = z.enum(LEVELS);
const contentTypeSchema = z.enum(CONTENT_TYPES);

export const createLearningSessionSchema = z
  .object({
    deckId: z.uuid('Pilih deck yang tersedia.'),
    studyDirection: z.enum(['recognition', 'production', 'mixed']),
    level: levelSchema,
    contentTypes: z.array(contentTypeSchema).min(1).max(CONTENT_TYPES.length),
    itemCount: z.coerce
      .number()
      .int()
      .refine(
        (value) => SESSION_ITEM_COUNTS.some((itemCount) => itemCount === value),
        'Pilih jumlah item yang tersedia.',
      ),
    vocabularyPartOfSpeech: z
      .enum([...VOCABULARY_PARTS_OF_SPEECH, 'all'])
      .default('all'),
    vocabularyVerbGroup: z.enum([...VOCABULARY_VERB_GROUPS, 'all']).default('all'),
    vocabularyTransitivity: z
      .enum([...VOCABULARY_TRANSITIVITIES, 'all'])
      .default('all'),
    vocabularyAdjectiveType: z
      .enum([...VOCABULARY_ADJECTIVE_TYPES, 'all'])
      .default('all'),
    vocabularyTheme: z.enum([...VOCABULARY_THEMES, 'all']).default('all'),
  })
  .refine(
    (value) => {
      const usesTaxonomy = [
        value.vocabularyPartOfSpeech,
        value.vocabularyVerbGroup,
        value.vocabularyTransitivity,
        value.vocabularyAdjectiveType,
        value.vocabularyTheme,
      ].some((filter) => filter !== 'all');
      return !usesTaxonomy || (value.contentTypes.includes('vocabulary') && ['N5', 'N4'].includes(value.level));
    },
    {
      message: 'Subkategori vocabulary saat ini hanya tersedia untuk N5 dan N4.',
      path: ['vocabularyTheme'],
    },
  );

export const learningSessionIdSchema = z.uuid();
export const sessionItemPositionSchema = z.number().int().nonnegative();

export type CreateLearningSessionInput = z.infer<typeof createLearningSessionSchema>;
