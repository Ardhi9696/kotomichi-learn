import type { Enums, Tables } from '@/lib/supabase/database.types';

export type ProgressState = Pick<
  Tables<'learning_progress'>,
  | 'status'
  | 'attempts_count'
  | 'correct_count'
  | 'review_count'
  | 'interval_days'
  | 'ease_factor'
  | 'mastered_at'
>;

export type ReviewUpdate = ProgressState & {
  lastRating: Enums<'review_rating'>;
  nextReviewAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function isReviewRatingAllowed(
  rating: Enums<'review_rating'>,
  isCorrect: boolean,
): boolean {
  return isCorrect || rating === 'forgot' || rating === 'hard';
}

export function calculateReviewUpdate(
  current: ProgressState | null,
  rating: Enums<'review_rating'>,
  isCorrect: boolean,
  now = new Date(),
): ReviewUpdate {
  const attemptsCount = (current?.attempts_count ?? 0) + 1;
  const correctCount = (current?.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const reviewCount = (current?.review_count ?? 0) + 1;
  const previousInterval = current?.interval_days ?? 0;
  const previousEase = current?.ease_factor ?? 2.5;

  let intervalDays = 0;
  let easeFactor = previousEase;
  let status: Enums<'learning_status'> = 'learning';
  let nextReviewAt = new Date(now.getTime() + 10 * 60 * 1000);

  if (rating === 'hard') {
    intervalDays = Math.max(1, Math.round(Math.max(1, previousInterval) * 1.2));
    easeFactor = Math.max(1.3, previousEase - 0.15);
    status = reviewCount > 1 ? 'review' : 'learning';
    nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS);
  }

  if (rating === 'good') {
    intervalDays =
      previousInterval === 0 ? 1 : Math.max(1, Math.round(previousInterval * previousEase));
    status = 'review';
    nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS);
  }

  if (rating === 'easy') {
    intervalDays =
      previousInterval === 0
        ? 4
        : Math.max(4, Math.round(previousInterval * previousEase * 1.3));
    easeFactor = Math.min(5, previousEase + 0.15);
    status = intervalDays >= 60 || reviewCount >= 8 ? 'mastered' : 'review';
    nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS);
  }

  return {
    status,
    attempts_count: attemptsCount,
    correct_count: correctCount,
    review_count: reviewCount,
    interval_days: intervalDays,
    ease_factor: Number(easeFactor.toFixed(2)),
    mastered_at: status === 'mastered' ? now.toISOString() : null,
    lastRating: rating,
    nextReviewAt: nextReviewAt.toISOString(),
  };
}
