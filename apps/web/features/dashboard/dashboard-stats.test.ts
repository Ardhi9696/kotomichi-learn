import { describe, expect, it } from 'vitest';

import {
  buildDashboardStats,
  type LearningActivityRow,
} from '@/features/dashboard/dashboard-stats';

const NOW = new Date('2026-07-27T10:00:00.000Z');

function activity(
  date: string,
  completedItems: number,
  correctAnswers = completedItems,
  totalAnswers = completedItems,
): LearningActivityRow {
  return {
    activity_date: date,
    completed_items: completedItems,
    correct_answers: correctAnswers,
    total_answers: totalAnswers,
    sessions_completed: completedItems > 0 ? 1 : 0,
  };
}

describe('buildDashboardStats', () => {
  it('builds a seven-day series and computes goal and weekly accuracy', () => {
    const result = buildDashboardStats(
      [activity('2026-07-25', 2, 1, 2), activity('2026-07-27', 6, 5, 6)],
      5,
      NOW,
    );

    expect(result.dailyActivity).toHaveLength(7);
    expect(result.dailyActivity[0]?.date).toBe('2026-07-21');
    expect(result.todayCompletedItems).toBe(6);
    expect(result.dailyGoalProgress).toBe(100);
    expect(result.weeklyCompletedItems).toBe(8);
    expect(result.weeklyAttempts).toBe(8);
    expect(result.weeklyAccuracy).toBe(75);
  });

  it('keeps the current streak when today is empty but yesterday was active', () => {
    const result = buildDashboardStats(
      [
        activity('2026-07-23', 1),
        activity('2026-07-24', 1),
        activity('2026-07-25', 1),
        activity('2026-07-26', 1),
      ],
      10,
      NOW,
    );

    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });

  it('separates the current streak from the longest historical streak', () => {
    const result = buildDashboardStats(
      [
        activity('2026-07-10', 1),
        activity('2026-07-11', 1),
        activity('2026-07-12', 1),
        activity('2026-07-26', 1),
        activity('2026-07-27', 1),
      ],
      10,
      NOW,
    );

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(3);
  });
});
