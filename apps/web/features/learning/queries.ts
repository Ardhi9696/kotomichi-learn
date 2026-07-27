import { notFound, redirect } from 'next/navigation';

import { getContentDetail } from '@/features/catalog/queries';
import { isLocale, type ContentDetail, type Locale } from '@/features/catalog/types';
import { learningSessionIdSchema } from '@/features/learning/session-schema';
import {
  buildQuizQuestion,
  getCorrectAnswers,
  isQuizQuestionType,
  type QuizQuestion,
} from '@/features/learning/quiz';
import type { Tables } from '@/lib/supabase/database.types';
import { requireUser } from '@/lib/auth/require-user';

type SessionSummary = Pick<
  Tables<'learning_sessions'>,
  | 'id'
  | 'level'
  | 'content_types'
  | 'target_item_count'
  | 'completed_item_count'
  | 'correct_item_count'
  | 'started_at'
  | 'completed_at'
  | 'session_mode'
>;

export type LearningHomeData = {
  targetLevel: Tables<'profiles'>['target_level'];
  dailyGoal: number;
  activeSessions: SessionSummary[];
};

export type LearningSessionData = {
  session: SessionSummary;
  currentItem: {
    position: number;
    detail: ContentDetail;
    phase:
      | { name: 'question'; question: QuizQuestion; startsOnQuiz: boolean }
      | {
          name: 'feedback';
          isCorrect: boolean;
          answerText: string | null;
          correctAnswers: string[];
        };
  } | null;
};

export type ReviewQueueData = {
  targetLevel: Tables<'profiles'>['target_level'];
  dueItems: Array<{
    id: string;
    title: string;
    type: Tables<'content_items'>['content_type'];
    dueAt: string;
  }>;
};

async function getDistractorDetails(
  contentItemId: string,
  detail: ContentDetail,
  locale: Locale,
): Promise<ContentDetail[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from('content_items')
    .select('id')
    .eq('is_active', true)
    .eq('level', detail.level)
    .eq('content_type', detail.type)
    .neq('id', contentItemId)
    .order('identity_key')
    .limit(20);

  if (error) throw new Error('Pilihan jawaban belum dapat dimuat.');
  return Promise.all(data.map((item) => getContentDetail(item.id, locale)));
}

export async function getLearningHomeData(): Promise<LearningHomeData> {
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_level,daily_goal,onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw new Error('Profil belajar belum dapat dimuat.');
  if (!profile?.onboarding_completed_at) redirect('/onboarding');

  const { data: sessions, error: sessionsError } = await supabase
    .from('learning_sessions')
    .select(
      'id,level,content_types,target_item_count,completed_item_count,correct_item_count,started_at,completed_at,session_mode',
    )
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(5);

  if (sessionsError) throw new Error('Sesi aktif belum dapat dimuat.');

  return {
    targetLevel: profile.target_level,
    dailyGoal: profile.daily_goal,
    activeSessions: sessions,
  };
}

export async function getLearningSession(rawSessionId: string): Promise<LearningSessionData> {
  const sessionIdResult = learningSessionIdSchema.safeParse(rawSessionId);
  if (!sessionIdResult.success) notFound();

  const { supabase, user } = await requireUser();
  const sessionId = sessionIdResult.data;
  const [{ data: session, error: sessionError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from('learning_sessions')
        .select(
          'id,level,content_types,target_item_count,completed_item_count,correct_item_count,started_at,completed_at,session_mode',
        )
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('content_locale').eq('id', user.id).maybeSingle(),
    ]);

  if (sessionError || profileError) throw new Error('Sesi belajar belum dapat dimuat.');
  if (!session) notFound();

  if (session.completed_at) return { session, currentItem: null };

  const { data: item, error: itemError } = await supabase
    .from('learning_session_items')
    .select('position,content_item_id,client_attempt_id,studied_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .is('completed_at', null)
    .order('position')
    .limit(1)
    .maybeSingle();

  if (itemError) throw new Error('Flashcard berikutnya belum dapat dimuat.');
  if (!item) return { session, currentItem: null };

  const localeValue = profile?.content_locale;
  const locale: Locale = isLocale(localeValue) ? localeValue : 'en';
  const detail = await getContentDetail(item.content_item_id, locale);

  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('answer_text,is_correct,question_type')
    .eq('user_id', user.id)
    .eq('client_attempt_id', item.client_attempt_id)
    .maybeSingle();

  if (attemptError) throw new Error('Hasil kuis belum dapat dimuat.');
  if (attempt) {
    if (!isQuizQuestionType(attempt.question_type)) {
      throw new Error('Jenis pertanyaan pada hasil kuis tidak valid.');
    }
    const correctAnswers = getCorrectAnswers(detail, attempt.question_type);
    return {
      session,
      currentItem: {
        position: item.position,
        detail,
        phase: {
          name: 'feedback',
          isCorrect: attempt.is_correct,
          answerText: attempt.answer_text,
          correctAnswers,
        },
      },
    };
  }

  const distractors = await getDistractorDetails(item.content_item_id, detail, locale);
  const question = buildQuizQuestion(
    detail,
    item.position,
    distractors,
    item.client_attempt_id,
  );

  return {
    session,
    currentItem: {
      position: item.position,
      detail,
      phase: {
        name: 'question',
        question,
        startsOnQuiz: session.session_mode === 'review' || Boolean(item.studied_at),
      },
    },
  };
}

export async function getReviewQueueData(): Promise<ReviewQueueData> {
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile) throw new Error('Profil review belum dapat dimuat.');

  const { data: progress, error: progressError } = await supabase
    .from('learning_progress')
    .select(
      'content_item_id,next_review_at,content_items!inner(id,level,content_type,word,character,pattern)',
    )
    .eq('user_id', user.id)
    .eq('content_items.level', profile.target_level)
    .in('status', ['learning', 'review'])
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at')
    .limit(30);
  if (progressError) throw new Error('Antrean review belum dapat dimuat.');

  return {
    targetLevel: profile.target_level,
    dueItems: progress.flatMap((row) => {
      const item = row.content_items;
      if (!row.next_review_at) return [];
      return [
        {
          id: item.id,
          title: item.word ?? item.character ?? item.pattern ?? 'Materi',
          type: item.content_type,
          dueAt: row.next_review_at,
        },
      ];
    }),
  };
}
