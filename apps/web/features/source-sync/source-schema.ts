import { z } from 'zod';

const levelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
const examplesSchema = z.array(z.record(z.string(), z.unknown())).default([]);
const textArraySchema = z.array(z.string().trim().min(1)).default([]);

const vocabularySchema = z.object({
  level: levelSchema,
  word: z.string().trim().min(1),
  reading: z.string().trim().default(''),
  meanings: z.array(z.string().trim().min(1)).min(1),
  examples: examplesSchema,
});

const kanjiSchema = z.object({
  level: levelSchema,
  character: z.string().trim().min(1),
  onyomi: textArraySchema,
  kunyomi: textArraySchema,
  meanings: textArraySchema,
  strokes: z.number().int().positive().nullable().optional(),
  grade: z.number().int().positive().nullable().optional(),
  frequency: z.number().int().positive().nullable().optional(),
});

const grammarSchema = z.object({
  level: levelSchema,
  pattern: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  formation: z.string().trim().default(''),
  examples: examplesSchema,
  tags: textArraySchema,
  notes: z.string().trim().default(''),
});

export const sourceManifestSchema = z.object({
  source_version: z.string().trim().min(1).max(120),
  source_commit: z.string().trim().max(80).default(''),
  dataset_checksum: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-f0-9]{64}$/, 'Checksum harus berupa SHA-256 64 karakter.'),
  vocabulary: z.array(vocabularySchema).min(1),
  kanji: z.array(kanjiSchema).min(1),
  grammar: z.array(grammarSchema).min(1),
});

export type SourceManifest = z.infer<typeof sourceManifestSchema>;

