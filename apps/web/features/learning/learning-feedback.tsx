'use client';

import { useFormStatus } from 'react-dom';

import type { ContentDetail } from '@/features/catalog/types';

const ratings = [
  { value: 'forgot', label: 'Lupa', note: '10 menit' },
  { value: 'hard', label: 'Sulit', note: '±1 hari' },
  { value: 'good', label: 'Bagus', note: 'jadwal normal' },
  { value: 'easy', label: 'Mudah', note: 'interval panjang' },
] as const;

function RatingButtons({ isCorrect }: { isCorrect: boolean }) {
  const { pending } = useFormStatus();

  return ratings.map((rating) => {
    const blockedByAnswer =
      !isCorrect && (rating.value === 'good' || rating.value === 'easy');
    return (
      <button
        aria-disabled={blockedByAnswer}
        className="rounded-xl border border-border bg-white/70 px-3 py-3 font-semibold transition enabled:hover:border-primary enabled:hover:text-primary focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-45"
        disabled={pending || blockedByAnswer}
        key={rating.value}
        name="rating"
        type="submit"
        value={rating.value}
      >
        {pending ? 'Menyimpan…' : rating.label}
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {rating.note}
        </span>
      </button>
    );
  });
}

export function LearningFeedback({
  detail,
  isCorrect,
  answerText,
  correctAnswers,
  onRate,
}: {
  detail: ContentDetail;
  isCorrect: boolean;
  answerText: string | null;
  correctAnswers: string[];
  onRate: (formData: FormData) => Promise<never>;
}) {
  return (
    <article
      className={`rounded-[2rem] border p-7 shadow-card sm:p-10 ${
        isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <header className="text-center">
        <p className="text-5xl" aria-hidden="true">
          {isCorrect ? '正' : '学'}
        </p>
        <p className="mt-5 text-xs font-bold tracking-[0.2em] uppercase">
          {isCorrect ? 'Jawaban benar' : 'Jawaban belum tepat'}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold">
          {isCorrect ? 'Bagus, pemahamanmu tepat.' : 'Mari kuatkan ingatanmu.'}
        </h1>
      </header>

      <dl className="mt-7 grid gap-4 rounded-2xl bg-white/70 p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Jawabanmu</dt>
          <dd className="mt-1 font-semibold">
            {answerText ?? 'Jawaban attempt lama tidak tersimpan.'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Jawaban benar</dt>
          <dd className="mt-1 font-semibold">{correctAnswers.join(' · ') || '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Seluruh makna</dt>
          <dd className="mt-1 font-semibold">{detail.meanings.join(' · ') || '—'}</dd>
        </div>
        {detail.type === 'vocabulary' ? (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Reading</dt>
            <dd className="mt-1 font-semibold">{detail.reading || '—'}</dd>
          </div>
        ) : null}
        {detail.type === 'kanji' ? (
          <>
            <div>
              <dt className="text-sm text-muted-foreground">On&apos;yomi</dt>
              <dd className="mt-1 font-semibold">{detail.onyomi.join(' · ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Kun&apos;yomi</dt>
              <dd className="mt-1 font-semibold">{detail.kunyomi.join(' · ') || '—'}</dd>
            </div>
          </>
        ) : null}
        {detail.type === 'grammar' ? (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Formation</dt>
            <dd className="mt-1 font-semibold">{detail.formation || '—'}</dd>
          </div>
        ) : null}
      </dl>

      {detail.isFallback ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Terjemahan locale pilihan belum tersedia; detail memakai sumber Inggris.
        </p>
      ) : null}

      {detail.examples[0] ? (
        <blockquote className="mt-6 rounded-2xl bg-white/70 p-5">
          <p className="text-lg font-medium" lang="ja">
            {detail.examples[0].ja}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {detail.examples[0].en}
          </p>
        </blockquote>
      ) : null}

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Pilih rating untuk langsung membuka kartu berikutnya.
      </p>
      <form action={onRate} className="mx-auto mt-3 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <RatingButtons isCorrect={isCorrect} />
      </form>
    </article>
  );
}
