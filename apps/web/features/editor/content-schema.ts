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

function splitList(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

const optionalPositiveInteger = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : value),
  z.coerce.number().int().positive().nullable(),
);

const examplesSchema = z.string().transform((value, context) => {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const examples = lines.map((line) => {
    const separator = line.indexOf('|');
    if (separator < 1) return null;
    const ja = line.slice(0, separator).trim();
    const en = line.slice(separator + 1).trim();
    return ja && en ? { ja, en } : null;
  });

  if (examples.some((example) => example === null)) {
    context.addIssue({
      code: 'custom',
      message: 'Gunakan format “kalimat Jepang | terjemahan” untuk setiap contoh.',
    });
    return z.NEVER;
  }

  return examples.filter((example): example is { ja: string; en: string } =>
    Boolean(example),
  );
});

export const editorialContentSchema = z.object({
  contentItemId: z
    .union([z.literal(''), z.uuid()])
    .transform((value) => (value ? value : null)),
  contentType: z.enum(CONTENT_TYPES),
  level: z.enum(LEVELS),
  title: z.string().trim().min(1, 'Judul materi wajib diisi.').max(200),
  reading: z.string().trim().max(200),
  meanings: z
    .string()
    .transform(splitList)
    .pipe(z.array(z.string()).min(1, 'Isi setidaknya satu makna.').max(50)),
  examples: examplesSchema,
  formation: z.string().trim().max(1000),
  tags: z.string().transform(splitList).pipe(z.array(z.string()).max(30)),
  notes: z.string().trim().max(3000),
  onyomi: z.string().transform(splitList).pipe(z.array(z.string()).max(30)),
  kunyomi: z.string().transform(splitList).pipe(z.array(z.string()).max(30)),
  strokes: optionalPositiveInteger,
  grade: optionalPositiveInteger,
  frequency: optionalPositiveInteger,
  partsOfSpeech: z.array(z.enum(VOCABULARY_PARTS_OF_SPEECH)),
  verbGroups: z.array(z.enum(VOCABULARY_VERB_GROUPS)),
  transitivities: z.array(z.enum(VOCABULARY_TRANSITIVITIES)),
  adjectiveTypes: z.array(z.enum(VOCABULARY_ADJECTIVE_TYPES)),
  themes: z.array(z.enum(VOCABULARY_THEMES)),
}).superRefine((value, context) => {
  if (value.contentType !== 'vocabulary') return;
  if (!value.partsOfSpeech.length) {
    context.addIssue({
      code: 'custom',
      path: ['partsOfSpeech'],
      message: 'Pilih setidaknya satu kelas kata untuk kosakata.',
    });
  }
  if (
    !value.partsOfSpeech.includes('verb') &&
    (value.verbGroups.length || value.transitivities.length)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['verbGroups'],
      message: 'Metadata kata kerja hanya dapat dipakai untuk kelas kata kerja.',
    });
  }
  if (
    !value.partsOfSpeech.includes('adjective') &&
    value.adjectiveTypes.length
  ) {
    context.addIssue({
      code: 'custom',
      path: ['adjectiveTypes'],
      message: 'Jenis kata sifat hanya dapat dipakai untuk kelas kata sifat.',
    });
  }
});

export const contentActiveSchema = z.object({
  contentItemId: z.uuid(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export type EditorialContentInput = z.infer<typeof editorialContentSchema>;
