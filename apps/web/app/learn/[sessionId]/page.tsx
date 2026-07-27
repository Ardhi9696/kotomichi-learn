import type { Metadata } from 'next';
import Link from 'next/link';

import { completeLearningItem, submitQuiz } from '@/features/learning/actions';
import { LearningCard } from '@/features/learning/learning-card';
import { LearningFeedback } from '@/features/learning/learning-feedback';
import { getLearningSession } from '@/features/learning/queries';

export const metadata: Metadata = {
  title: 'Flashcard belajar',
};

type LearningSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function LearningSessionPage({ params }: LearningSessionPageProps) {
  const { sessionId } = await params;
  const data = await getLearningSession(sessionId);

  if (!data.currentItem) {
    return (
      <div className="paper-grid min-h-[calc(100vh-7rem)] px-5 py-16 sm:px-8">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center shadow-card sm:p-12">
          <span className="text-5xl" aria-hidden="true">
            完
          </span>
          <p className="mt-6 text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Sesi selesai
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">
            Satu langkah sudah kamu tuntaskan.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Kamu mempelajari {data.session.completed_item_count} materi {data.session.level}.
            {' '}Akurasi sesi{' '}
            {data.session.completed_item_count
              ? Math.round(
                  (data.session.correct_item_count / data.session.completed_item_count) * 100,
                )
              : 0}
            %.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover"
              href="/learn"
            >
              Mulai sesi baru
            </Link>
            <Link
              className="rounded-full border border-border px-6 py-3 font-semibold hover:border-primary/40 hover:text-primary"
              href="/dashboard"
            >
              Kembali ke dashboard
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const completed = data.session.completed_item_count;
  const currentNumber = completed + 1;
  const submitCurrentQuiz = submitQuiz.bind(null, data.session.id, data.currentItem.position);
  const continueToNextItem = completeLearningItem.bind(
    null,
    data.session.id,
    data.currentItem.position,
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <Link className="font-semibold text-muted-foreground hover:text-primary" href="/learn">
            ← Simpan dan keluar
          </Link>
          <span className="font-semibold">
            {currentNumber} / {data.session.target_item_count}
          </span>
        </div>
        <div
          aria-label={`Progres sesi ${completed} dari ${data.session.target_item_count}`}
          aria-valuemax={data.session.target_item_count}
          aria-valuemin={0}
          aria-valuenow={completed}
          className="mt-4 h-2 overflow-hidden rounded-full bg-primary-soft"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${Math.round((completed / data.session.target_item_count) * 100)}%`,
            }}
          />
        </div>
      </header>

      {data.currentItem.phase.name === 'question' ? (
        <LearningCard
          detail={data.currentItem.detail}
          key={`${data.session.id}:${data.currentItem.position}`}
          onSubmit={submitCurrentQuiz}
          question={data.currentItem.phase.question}
          startsOnQuiz={data.currentItem.phase.startsOnQuiz}
        />
      ) : null}

      {data.currentItem.phase.name === 'feedback' ? (
        <LearningFeedback
          answerText={data.currentItem.phase.answerText}
          correctAnswers={data.currentItem.phase.correctAnswers}
          detail={data.currentItem.detail}
          isCorrect={data.currentItem.phase.isCorrect}
          onRate={continueToNextItem}
        />
      ) : null}
    </div>
  );
}
