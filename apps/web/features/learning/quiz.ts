import { z } from 'zod';

import type { ContentDetail } from '@/features/catalog/types';

export const QUIZ_QUESTION_TYPES = [
  'meaning_choice',
  'reading_choice',
  'recall',
] as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export type QuizQuestion = {
  questionType: QuizQuestionType;
  prompt: string;
  instruction: string;
  choices: string[] | null;
};

export const quizSubmissionSchema = z.object({
  questionType: z.enum(QUIZ_QUESTION_TYPES),
  answer: z.string().trim().min(1, 'Isi jawaban sebelum melanjutkan.').max(500),
  responseTimeMs: z.coerce.number().int().min(0).max(60 * 60 * 1000).optional(),
});

export function isQuizQuestionType(value: string): value is QuizQuestionType {
  return QUIZ_QUESTION_TYPES.some((questionType) => questionType === value);
}

export function getQuizQuestionType(
  detail: ContentDetail,
  position: number,
): QuizQuestionType {
  if (detail.type === 'grammar') return 'meaning_choice';
  if (position % 2 === 0 && getReadings(detail).length > 0) return 'reading_choice';
  return 'meaning_choice';
}

function normalized(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase()
    .replaceAll(/\s+/g, ' ');
}

export function getCorrectAnswers(
  detail: ContentDetail,
  questionType: QuizQuestionType,
): string[] {
  if (questionType === 'reading_choice') return getReadings(detail);
  return detail.meanings.filter(Boolean);
}

export function evaluateQuizAnswer(
  detail: ContentDetail,
  questionType: QuizQuestionType,
  answer: string,
): boolean {
  const normalizedAnswer = normalized(answer);
  return getCorrectAnswers(detail, questionType).some(
    (correctAnswer) => normalized(correctAnswer) === normalizedAnswer,
  );
}

function getReadings(detail: ContentDetail): string[] {
  if (detail.type === 'kanji') {
    return [...new Set([...detail.onyomi, ...detail.kunyomi].map((value) => value.trim()))].filter(
      Boolean,
    );
  }
  return detail.reading?.trim() ? [detail.reading.trim()] : [];
}

function choiceValues(
  detail: ContentDetail,
  questionType: QuizQuestionType,
): string[] {
  if (questionType === 'reading_choice') return getReadings(detail);
  return detail.meanings.map((value) => value.trim()).filter(Boolean);
}

function stableOffset(value: string, size: number): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return size ? hash % size : 0;
}

function uniqueChoices(values: string[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const trimmed = value.trim();
    const key = normalized(trimmed);
    if (!trimmed || seen.has(key)) return [];
    seen.add(key);
    return [trimmed];
  });
}

export function buildQuizQuestion(
  detail: ContentDetail,
  position: number,
  distractors: ContentDetail[],
  attemptId: string,
): QuizQuestion {
  const questionType = getQuizQuestionType(detail, position);
  const correctAnswer = choiceValues(detail, questionType)[0] ?? '';
  const choiceCandidates = uniqueChoices([
    correctAnswer,
    ...distractors.flatMap((item) => choiceValues(item, questionType)),
  ]);
  if (choiceCandidates.length === 1) {
    choiceCandidates.push('Tidak ada jawaban yang sesuai');
  }
  const choices = choiceCandidates.slice(0, 4);
  const offset = stableOffset(attemptId, choices.length);
  const rotatedChoices = [...choices.slice(offset), ...choices.slice(0, offset)];

  return {
    questionType,
    prompt:
      questionType === 'reading_choice'
        ? `Bagaimana cara membaca ${detail.title}?`
        : `Apa makna utama dari ${detail.title}?`,
    instruction: 'Pilih satu jawaban yang paling tepat.',
    choices: rotatedChoices,
  };
}
