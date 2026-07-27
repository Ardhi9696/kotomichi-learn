import { describe, expect, it } from 'vitest';

import {
  calculateReviewUpdate,
  isReviewRatingAllowed,
  type ProgressState,
} from './spaced-repetition';

const now = new Date('2026-07-27T00:00:00.000Z');

describe('calculateReviewUpdate', () => {
  it('rejects crafted good and easy ratings after an incorrect answer', () => {
    expect(isReviewRatingAllowed('forgot', false)).toBe(true);
    expect(isReviewRatingAllowed('hard', false)).toBe(true);
    expect(isReviewRatingAllowed('good', false)).toBe(false);
    expect(isReviewRatingAllowed('easy', false)).toBe(false);
    expect(isReviewRatingAllowed('easy', true)).toBe(true);
  });

  it('schedules forgotten material again in ten minutes', () => {
    const result = calculateReviewUpdate(null, 'forgot', false, now);

    expect(result.status).toBe('learning');
    expect(result.interval_days).toBe(0);
    expect(result.nextReviewAt).toBe('2026-07-27T00:10:00.000Z');
  });

  it('uses the ease factor for a good review', () => {
    const current: ProgressState = {
      status: 'review',
      attempts_count: 3,
      correct_count: 2,
      review_count: 3,
      interval_days: 4,
      ease_factor: 2.5,
      mastered_at: null,
    };
    const result = calculateReviewUpdate(current, 'good', true, now);

    expect(result.interval_days).toBe(10);
    expect(result.correct_count).toBe(3);
    expect(result.status).toBe('review');
  });

  it('masters mature material after an easy review', () => {
    const current: ProgressState = {
      status: 'review',
      attempts_count: 8,
      correct_count: 7,
      review_count: 7,
      interval_days: 30,
      ease_factor: 2.5,
      mastered_at: null,
    };
    const result = calculateReviewUpdate(current, 'easy', true, now);

    expect(result.status).toBe('mastered');
    expect(result.mastered_at).toBe(now.toISOString());
  });
});
