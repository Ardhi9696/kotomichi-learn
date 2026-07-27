import { redirect } from 'next/navigation';

import {
  buildDashboardStats,
  type DailyActivity,
  type LearningActivityRow,
} from '@/features/dashboard/dashboard-stats';
import { requireUser } from '@/lib/auth/require-user';
import type { Enums, Tables } from '@/lib/supabase/database.types';

type ProgressRow = Pick<
  Tables<'learning_progress'>,
  'status' | 'attempts_count' | 'correct_count' | 'next_review_at'
> & {
  content_items: Pick<Tables<'content_items'>, 'content_type'>;
};

const TARGET_TOTALS: Record<Enums<'jlpt_level'>, number> = {
  N5: 761,
  N4: 818,
  N3: 2171,
  N2: 2180,
  N1: 4715,
};

export type DashboardData = {
  userId: string;
  email: string;
  displayName: string;
  targetLevel: Enums<'jlpt_level'>;
  contentLocale: string;
  dailyGoal: number;
  totalItems: number;
  masteredItems: number;
  learningItems: number;
  dueItems: number;
  attempts: number;
  accuracy: number;
  completion: number;
  todayCompletedItems: number;
  dailyGoalProgress: number;
  currentStreak: number;
  longestStreak: number;
  weeklyCompletedItems: number;
  weeklyAttempts: number;
  weeklyAccuracy: number;
  dailyActivity: DailyActivity[];
  contentBreakdown: {
    contentType: Enums<'content_type'>;
    learned: number;
    mastered: number;
  }[];
  recentSessions: Pick<
    Tables<'learning_sessions'>,
    | 'id'
    | 'level'
    | 'completed_item_count'
    | 'correct_item_count'
    | 'started_at'
    | 'completed_at'
    | 'session_mode'
  >[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'display_name,target_level,content_locale,daily_goal,onboarding_completed_at',
    )
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw new Error('Profil belum dapat dimuat.');
  if (!profile?.onboarding_completed_at) redirect('/onboarding');

  const [progressResult, sessionsResult, activityResult] =
    await Promise.all([
    supabase
      .from('learning_progress')
      .select(
        'status,attempts_count,correct_count,next_review_at,content_items!inner(level,content_type)',
      )
      .eq('user_id', user.id)
      .eq('content_items.level', profile.target_level),
    supabase
      .from('learning_sessions')
      .select(
        'id,level,completed_item_count,correct_item_count,started_at,completed_at,session_mode',
      )
      .eq('user_id', user.id)
      .eq('level', profile.target_level)
      .order('started_at', { ascending: false })
      .limit(5),
    supabase.rpc('get_learning_activity', { p_timezone: 'Asia/Jakarta' }),
  ]);

  if (
    progressResult.error ||
    sessionsResult.error ||
    activityResult.error
  ) {
    throw new Error('Ringkasan belajar belum dapat dimuat.');
  }

  const progressRows: ProgressRow[] = progressResult.data ?? [];
  const now = Date.now();
  const masteredItems = progressRows.filter((row) => row.status === 'mastered').length;
  const learningItems = progressRows.filter((row) => row.status !== 'new').length;
  const dueItems = progressRows.filter(
    (row) =>
      row.next_review_at !== null &&
      new Date(row.next_review_at).getTime() <= now &&
      (row.status === 'learning' || row.status === 'review'),
  ).length;
  const attempts = progressRows.reduce((total, row) => total + row.attempts_count, 0);
  const correct = progressRows.reduce((total, row) => total + row.correct_count, 0);
  const totalItems = TARGET_TOTALS[profile.target_level];
  const advancedStats = buildDashboardStats(
    (activityResult.data ?? []) as LearningActivityRow[],
    profile.daily_goal,
  );
  const contentTypes: Enums<'content_type'>[] = ['vocabulary', 'kanji', 'grammar'];

  return {
    userId: user.id,
    email: user.email ?? '',
    displayName: profile.display_name ?? user.email?.split('@')[0] ?? 'Learner',
    targetLevel: profile.target_level,
    contentLocale: profile.content_locale,
    dailyGoal: profile.daily_goal,
    totalItems,
    masteredItems,
    learningItems,
    dueItems,
    attempts,
    accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    completion: Math.min(100, Math.round((masteredItems / totalItems) * 100)),
    ...advancedStats,
    contentBreakdown: contentTypes.map((contentType) => {
      const rows = progressRows.filter(
        (row) => row.content_items.content_type === contentType,
      );
      return {
        contentType,
        learned: rows.filter((row) => row.status !== 'new').length,
        mastered: rows.filter((row) => row.status === 'mastered').length,
      };
    }),
    recentSessions: sessionsResult.data ?? [],
  };
}
