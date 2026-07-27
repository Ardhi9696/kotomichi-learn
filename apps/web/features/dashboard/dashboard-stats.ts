export type LearningActivityRow = {
  activity_date: string;
  completed_items: number;
  correct_answers: number;
  total_answers: number;
  sessions_completed: number;
};

export type DailyActivity = {
  date: string;
  completedItems: number;
  correctAnswers: number;
  totalAnswers: number;
  sessionsCompleted: number;
};

export type DashboardStats = {
  todayCompletedItems: number;
  dailyGoalProgress: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletedItems: number;
  weeklyAttempts: number;
  weeklyAccuracy: number;
  dailyActivity: DailyActivity[];
};

function dateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function buildDashboardStats(
  rows: LearningActivityRow[],
  dailyGoal: number,
  now = new Date(),
  timeZone = 'Asia/Jakarta',
): DashboardStats {
  const totals = new Map<string, DailyActivity>();
  for (const row of rows) {
    const current = totals.get(row.activity_date) ?? {
      date: row.activity_date,
      completedItems: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      sessionsCompleted: 0,
    };
    current.completedItems += Number(row.completed_items);
    current.correctAnswers += Number(row.correct_answers);
    current.totalAnswers += Number(row.total_answers);
    current.sessionsCompleted += Number(row.sessions_completed);
    totals.set(row.activity_date, current);
  }

  const today = dateKey(now, timeZone);
  const activeDates = new Set(
    [...totals.values()]
      .filter((activity) => activity.completedItems > 0)
      .map((activity) => activity.date),
  );
  let streakCursor = activeDates.has(today) ? today : shiftDate(today, -1);
  let currentStreak = 0;
  while (activeDates.has(streakCursor)) {
    currentStreak += 1;
    streakCursor = shiftDate(streakCursor, -1);
  }

  const sortedActiveDates = [...activeDates].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;
  for (const activeDate of sortedActiveDates) {
    runningStreak =
      previousDate !== null && shiftDate(previousDate, 1) === activeDate
        ? runningStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = activeDate;
  }

  const dailyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    return (
      totals.get(date) ?? {
        date,
        completedItems: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        sessionsCompleted: 0,
      }
    );
  });
  const weeklyCompletedItems = dailyActivity.reduce(
    (total, activity) => total + activity.completedItems,
    0,
  );
  const weeklyAttempts = dailyActivity.reduce(
    (total, activity) => total + activity.totalAnswers,
    0,
  );
  const weeklyCorrect = dailyActivity.reduce(
    (total, activity) => total + activity.correctAnswers,
    0,
  );
  const todayCompletedItems = totals.get(today)?.completedItems ?? 0;

  return {
    todayCompletedItems,
    dailyGoalProgress:
      dailyGoal > 0 ? Math.min(100, Math.round((todayCompletedItems / dailyGoal) * 100)) : 0,
    currentStreak,
    longestStreak,
    weeklyCompletedItems,
    weeklyAttempts,
    weeklyAccuracy:
      weeklyAttempts > 0 ? Math.round((weeklyCorrect / weeklyAttempts) * 100) : 0,
    dailyActivity,
  };
}
