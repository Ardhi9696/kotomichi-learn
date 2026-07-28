'use client';

import { useEffect, useRef, useState } from 'react';

import { SubmitButton } from '@/components/auth/submit-button';
import type { ContentDetail } from '@/features/catalog/types';
import type { QuizQuestion } from '@/features/learning/quiz';
import { adjectiveTypeLabels } from '@/features/catalog/vocabulary-taxonomy';

const typeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

export function LearningCard({
  detail,
  question,
  startsOnQuiz = false,
  onSubmit,
}: {
  detail: ContentDetail;
  question: QuizQuestion;
  startsOnQuiz?: boolean;
  onSubmit: (formData: FormData) => Promise<never>;
}) {
  const [side, setSide] = useState<'front' | 'quiz'>(
    startsOnQuiz ? 'quiz' : 'front',
  );
  const firstChoiceRef = useRef<HTMLInputElement>(null);
  const responseTimeRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number | null>(null);
  const isQuiz = side === 'quiz';

  useEffect(() => {
    if (!isQuiz) return;
    startedAt.current = Date.now();
    firstChoiceRef.current?.focus();
  }, [isQuiz]);

  return (
    <article className="[perspective:1200px]">
      <div
        className={`grid transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none ${
          isQuiz ? '[transform:rotateY(180deg)] motion-reduce:transform-none' : ''
        }`}
      >
        <section
          aria-hidden={isQuiz}
          className={`col-start-1 row-start-1 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card [backface-visibility:hidden] ${
            isQuiz ? 'pointer-events-none motion-reduce:invisible' : ''
          }`}
          inert={isQuiz}
        >
          <div className="paper-grid px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="flex justify-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                {detail.level}
              </span>
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
                {typeLabels[detail.type]}
              </span>
              {detail.taxonomy?.adjectiveTypes.map((type) => (
                <span
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground"
                  key={type}
                >
                  {adjectiveTypeLabels[type]}
                </span>
              ))}
            </div>
            <h1
              className={
                detail.type === 'kanji'
                  ? 'mt-8 font-serif text-8xl leading-none font-bold'
                  : 'mt-8 font-serif text-5xl leading-tight font-bold'
              }
              lang="ja"
            >
              {detail.title}
            </h1>
            <button
              className="mx-auto mt-10 block w-full max-w-sm rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2"
              onClick={() => setSide('quiz')}
              tabIndex={isQuiz ? -1 : 0}
              type="button"
            >
              Balik kartu · Mulai kuis
            </button>
          </div>
        </section>

        <section
          aria-hidden={!isQuiz}
          className={`col-start-1 row-start-1 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)] motion-reduce:transform-none ${
            isQuiz ? '' : 'pointer-events-none motion-reduce:invisible'
          }`}
          inert={!isQuiz}
        >
          <header className="paper-grid border-b border-border px-6 py-9 text-center sm:px-10">
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Kuis</p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              {question.prompt}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{question.instruction}</p>
          </header>

          <form
            action={onSubmit}
            className="p-6 sm:p-10"
            onSubmit={() => {
              if (responseTimeRef.current && startedAt.current !== null) {
                responseTimeRef.current.value = String(Date.now() - startedAt.current);
              }
            }}
          >
            <input name="question_type" type="hidden" value={question.questionType} />
            <input name="response_time_ms" ref={responseTimeRef} type="hidden" value="0" />

            <fieldset className="grid gap-3">
              <legend className="sr-only">Pilihan jawaban untuk {detail.title}</legend>
              {question.choices?.map((choice, index) => (
                <label className="cursor-pointer" key={choice}>
                  <input
                    className="peer sr-only"
                    disabled={!isQuiz}
                    name="answer"
                    ref={index === 0 ? firstChoiceRef : undefined}
                    required
                    type="radio"
                    value={choice}
                  />
                  <span className="block rounded-xl border border-border bg-background px-5 py-4 font-medium transition hover:border-primary/35 peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                    {choice}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="mx-auto mt-8 max-w-sm">
              <SubmitButton pendingLabel="Memeriksa jawaban…">Periksa jawaban</SubmitButton>
            </div>
          </form>
        </section>
      </div>
    </article>
  );
}
