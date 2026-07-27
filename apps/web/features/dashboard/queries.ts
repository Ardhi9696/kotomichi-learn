import { redirect } from 'next/navigation';

import type { Enums, Tables } from '@/lib/supabase/database.types';
import { requireUser } from '@/lib/auth/require-user';
import {
  buildDashboardStats,
  type DailyActivity,
  type LearningActivityRow,
} from '@/features/dashboard/dashboard-stats';

const TARGET_TOTALS: Record<Enums<'jlpt_level'>, number> = {
  N5: 761,
  N4: 818,
  N3: 2171,
  N2: 2180,
  N1: 4715,
};

type DashboardSummaryRow = {
  mastered_count: number;
  learning_count: number;
  new_count: number;
  due_count: number;
  total_attempts: number;
  total_correct: number;
  total_items: number;
  content_breakdown: {
    content_type: Enums<'content_type'>;
    learned: number;
    mastered: number;
  }[];
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
    .select('display_name,target_level,content_locale,daily_goal,onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw new Error('Profil belum dapat dimuat.');
  if (!profile?.onboarding_completed_at) redirect('/onboarding');

  const [
    summaryResult,
    sessionsResult,
    activityResult,
  ] = await Promise.all([
    supabase.rpc('get_dashboard_summary', {
      p_target_level: profile.target_level,
    }),
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

  if (summaryResult.error || sessionsResult.error || activityResult.error) {
    throw new Error('Ringkasan belajar belum dapat dimuat.');
  }

  const summary: DashboardSummaryRow | undefined =
    (summaryResult.data?.[0] as DashboardSummaryRow | undefined) ?? undefined;
  const masteredItems = summary?.mastered_count ?? 0;
  const learningItems = summary?.learning_count ?? 0;
  const dueItems = summary?.due_count ?? 0;
  const attempts = summary?.total_attempts ?? 0;
  const correct = summary?.total_correct ?? 0;
  const totalItems = summary?.total_items ?? TARGET_TOTALS[profile.target_level];

  const advancedStats = buildDashboardStats(
    (activityResult.data ?? []) as LearningActivityRow[],
    profile.daily_goal,
  );

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
    contentBreakdown: (summary?.content_breakdown ?? []).map((b) => ({
      contentType: b.content_type,
      learned: b.learned,
      mastered: b.mastered,
    })),
    recentSessions: sessionsResult.data ?? [],
  };
}
