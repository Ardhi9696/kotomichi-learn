import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ContentDetail } from '@/features/catalog/types';
import type { QuizQuestion } from '@/features/learning/quiz';

import { LearningCard } from './learning-card';

const detail: ContentDetail = {
  id: 'content-id',
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

const question: QuizQuestion = {
  questionType: 'meaning_choice',
  prompt: 'Apa makna utama dari 道?',
  instruction: 'Pilih satu jawaban yang paling tepat.',
  choices: ['way', 'river'],
};

const unusedAction = async (): Promise<never> => {
  throw new Error('Action should not run in this test.');
};

describe('LearningCard', () => {
  it('does not expose answers on the front and focuses the first choice after flip', async () => {
    render(<LearningCard detail={detail} onSubmit={unusedAction} question={question} />);

    expect(screen.getByText('道')).toBeVisible();
    expect(screen.queryByRole('radio', { name: 'way' })).not.toBeInTheDocument();
    expect(screen.queryByText('みち')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Balik kartu · Mulai kuis' }));

    const firstChoice = screen.getByRole('radio', { name: 'way' });
    await waitFor(() => expect(firstChoice).toHaveFocus());
  });

  it('opens review sessions directly on the quiz', async () => {
    render(
      <LearningCard
        detail={detail}
        onSubmit={unusedAction}
        question={question}
        startsOnQuiz
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Balik kartu · Mulai kuis' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'way' })).toHaveFocus());
  });

  it('resets local side and selection when the keyed item changes', () => {
    const { rerender } = render(
      <LearningCard
        detail={detail}
        key="item-1"
        onSubmit={unusedAction}
        question={question}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Balik kartu · Mulai kuis' }));
    fireEvent.click(screen.getByRole('radio', { name: 'way' }));

    rerender(
      <LearningCard
        detail={{ ...detail, id: 'content-2', title: '川' }}
        key="item-2"
        onSubmit={unusedAction}
        question={{ ...question, prompt: 'Apa makna utama dari 川?' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Balik kartu · Mulai kuis' })).toBeVisible();
    expect(screen.queryByRole('radio', { name: 'way' })).not.toBeInTheDocument();
  });

  it('disables submit while the action is pending', async () => {
    const pendingAction = () => new Promise<never>(() => undefined);
    render(
      <LearningCard
        detail={detail}
        onSubmit={pendingAction}
        question={question}
        startsOnQuiz
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: 'way' }));
    fireEvent.click(screen.getByRole('button', { name: 'Periksa jawaban' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Memeriksa jawaban…' })).toBeDisabled(),
    );
  });
});
