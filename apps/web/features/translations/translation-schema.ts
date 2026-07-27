import { z } from 'zod';

import { CONTENT_TYPES } from '@/features/catalog/types';

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const examplesSchema = z.string().transform((value, context) => {
  const examples = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('|');
      if (separator < 1) return null;
      const ja = line.slice(0, separator).trim();
      const translated = line.slice(separator + 1).trim();
      return ja && translated ? { ja, en: translated } : null;
    });
  if (examples.some((example) => example === null)) {
    context.addIssue({
      code: 'custom',
      message: 'Gunakan format “kalimat Jepang | terjemahan” untuk setiap contoh.',
    });
    return z.NEVER;
  }
  return examples.filter((value): value is { ja: string; en: string } => value !== null);
});

export const translationDraftSchema = z.object({
  contentItemId: z.uuid(),
  contentType: z.enum(CONTENT_TYPES),
  locale: z.enum(['id', 'ko']),
  meanings: z
    .string()
    .transform(splitList)
    .pipe(z.array(z.string()).min(1, 'Isi setidaknya satu terjemahan.').max(50)),
  examples: examplesSchema,
  formation: z.string().trim().max(1000),
  tags: z.string().transform(splitList).pipe(z.array(z.string()).max(30)),
  notes: z.string().trim().max(3000),
});

export const translationIdentitySchema = z.object({
  contentItemId: z.uuid(),
  contentType: z.enum(CONTENT_TYPES),
  locale: z.enum(['id', 'ko']),
});

export const reviewTranslationSchema = translationIdentitySchema.extend({
  status: z.enum(['draft', 'reviewed', 'published', 'needs_review']),
  reviewNotes: z.string().trim().max(2000),
});
