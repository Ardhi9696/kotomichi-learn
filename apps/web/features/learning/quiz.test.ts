import { describe, expect, it } from 'vitest';

import type { ContentDetail } from '@/features/catalog/types';

import {
  buildQuizQuestion,
  evaluateQuizAnswer,
  getQuizQuestionType,
  quizSubmissionSchema,
} from './quiz';

const vocabulary: ContentDetail = {
  id: 'vocab-1',
  type: 'vocabulary',
  level: 'N5',
  title: '道',
  reading: 'みち',
  meanings: ['way', 'road'],
  supportingText: null,
  taxonomy: null,
  examples: [],
  locale: 'en',
  isFallback: false,
};

describe('quiz domain', () => {
  it('alternates vocabulary reading and meaning choices without generating recall', () => {
    expect(getQuizQuestionType(vocabulary, 0)).toBe('reading_choice');
    expect(getQuizQuestionType(vocabulary, 1)).toBe('meaning_choice');
    expect(getQuizQuestionType(vocabulary, 2)).toBe('reading_choice');
    expect(
      [0, 1, 2, 3, 4].map((position) => getQuizQuestionType(vocabulary, position)),
    ).not.toContain('recall');
  });

  it('falls back to meaning when vocabulary has no reading', () => {
    expect(getQuizQuestionType({ ...vocabulary, reading: null }, 0)).toBe(
      'meaning_choice',
    );
  });

  it('alternates kanji readings from onyomi and kunyomi with meaning', () => {
    const kanji: ContentDetail = {
      ...vocabulary,
      type: 'kanji',
      title: '道',
      reading: null,
      onyomi: ['ドウ'],
      kunyomi: ['みち'],
      strokes: 12,
      grade: 2,
      frequency: 207,
    };

    expect(getQuizQuestionType(kanji, 0)).toBe('reading_choice');
    expect(getQuizQuestionType(kanji, 1)).toBe('meaning_choice');
    expect(evaluateQuizAnswer(kanji, 'reading_choice', 'みち')).toBe(true);
    expect(evaluateQuizAnswer(kanji, 'reading_choice', 'ドウ')).toBe(true);
  });

  it('keeps accepting normalized recall attempts from old history', () => {
    expect(evaluateQuizAnswer(vocabulary, 'recall', '  ROAD ')).toBe(true);
    expect(evaluateQuizAnswer(vocabulary, 'recall', 'river')).toBe(false);
  });

  it('validates persisted answer text as non-empty and at most 500 characters', () => {
    expect(
      quizSubmissionSchema.safeParse({
        questionType: 'meaning_choice',
        answer: ' ',
        responseTimeMs: 10,
      }).success,
    ).toBe(false);
    expect(
      quizSubmissionSchema.safeParse({
        questionType: 'meaning_choice',
        answer: 'a'.repeat(501),
        responseTimeMs: 10,
      }).success,
    ).toBe(false);
  });

  it('builds four deterministic unique choices containing the correct answer', () => {
    const distractors = ['かわ', 'やま', 'そら', 'うみ'].map((reading, index) => ({
      ...vocabulary,
      id: `vocab-${index + 2}`,
      reading,
    }));
    const first = buildQuizQuestion(vocabulary, 0, distractors, 'attempt-1');
    const second = buildQuizQuestion(vocabulary, 0, distractors, 'attempt-1');

    expect(first).toEqual(second);
    expect(first.questionType).not.toBe('recall');
    expect(first.choices).toHaveLength(4);
    expect(new Set(first.choices)).toHaveLength(4);
    expect(first.choices).toContain('みち');
    expect(first.choices).toContain('かわ');
  });

  it('keeps at least two choices when the distractor dataset is too small', () => {
    const questionWithFallback = buildQuizQuestion(vocabulary, 0, [], 'attempt-2');

    expect(questionWithFallback.choices).toEqual(
      expect.arrayContaining(['みち', 'Tidak ada jawaban yang sesuai']),
    );
    expect(questionWithFallback.choices).toHaveLength(2);
  });
});
