import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ContentDetail } from '@/features/catalog/types';

import { LearningFeedback } from './learning-feedback';

const detail: ContentDetail = {
  id: 'content-id',
  type: 'vocabulary',
  level: 'N5',
  title: '道',
  reading: 'みち',
  meanings: ['way', 'road'],
  supportingText: null,
  taxonomy: null,
  examples: [{ ja: 'この道を歩きます。', en: 'I walk this road.' }],
  locale: 'id',
  isFallback: true,
};

const unusedAction = async (): Promise<never> => {
  throw new Error('Action should not run in this test.');
};

describe('LearningFeedback', () => {
  it('shows the selected answer, correct answers, material details, and fallback', () => {
    render(
      <LearningFeedback
        answerText="river"
        correctAnswers={['way', 'road']}
        detail={detail}
        isCorrect={false}
        onRate={unusedAction}
      />,
    );

    expect(screen.getByText('Jawaban belum tepat')).toBeVisible();
    expect(screen.getByText('river')).toBeVisible();
    expect(screen.getAllByText('way · road')).toHaveLength(2);
    expect(screen.getByText('みち')).toBeVisible();
    expect(screen.getByText('この道を歩きます。')).toBeVisible();
    expect(screen.getByText(/sumber Inggris/)).toBeVisible();
  });

  it('only enables forgot and hard after a wrong answer', () => {
    render(
      <LearningFeedback
        answerText={null}
        correctAnswers={['way']}
        detail={detail}
        isCorrect={false}
        onRate={unusedAction}
      />,
    );

    expect(screen.getByRole('button', { name: /Lupa/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Sulit/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Bagus/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Mudah/ })).toBeDisabled();
    expect(screen.getByText('Jawaban attempt lama tidak tersimpan.')).toBeVisible();
  });

  it('enables every rating after a correct answer', () => {
    render(
      <LearningFeedback
        answerText="way"
        correctAnswers={['way', 'road']}
        detail={detail}
        isCorrect
        onRate={unusedAction}
      />,
    );

    for (const label of ['Lupa', 'Sulit', 'Bagus', 'Mudah']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeEnabled();
    }
  });
});
