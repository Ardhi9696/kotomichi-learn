import { notFound, redirect } from 'next/navigation';

import { getContentDetail } from '@/features/catalog/queries';
import { isLocale, type ContentDetail, type Locale } from '@/features/catalog/types';
import { parseExamples } from '@/features/catalog/types';
import { learningSessionIdSchema } from '@/features/learning/session-schema';
import {
  buildQuizQuestion,
  getCorrectAnswers,
  isQuizQuestionType,
  type QuizQuestion,
} from '@/features/learning/quiz';
import type { Database, Tables } from '@/lib/supabase/database.types';
import { requireUser } from '@/lib/auth/require-user';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  | 'deck_id'
  | 'study_direction'
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
      | { name: 'production' }
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
  supabase: SupabaseClient<Database>,
  contentItemId: string,
  detail: ContentDetail,
  locale: Locale,
): Promise<ContentDetail[]> {
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
  const ids = data.map((item) => item.id);
  return Promise.all(ids.map((id) => getLearningContentDetail(supabase, id, locale)));
}

export async function getLearningContentDetail(
  supabase: SupabaseClient<Database>,
  contentItemId: string,
  locale: Locale,
): Promise<ContentDetail> {
  const { data: item, error } = await supabase
    .from('content_items')
    .select('id,content_type,level,word,reading,character,pattern,deck_id,is_active')
    .eq('id', contentItemId)
    .maybeSingle();
  if (error || !item) throw new Error('Materi belajar belum dapat dimuat.');
  if (!item.deck_id) {
    if (item.is_active) return getContentDetail(contentItemId, locale);

    if (item.content_type === 'vocabulary') {
      const [{ data: version }, { data: translation }, { data: taxonomy }] =
        await Promise.all([
          supabase
            .from('vocab')
            .select('meanings,examples')
            .eq('content_item_id', contentItemId)
            .maybeSingle(),
          locale === 'en'
            ? Promise.resolve({ data: null })
            : supabase
                .from('vocab_translations')
                .select('meanings,examples')
                .eq('content_item_id', contentItemId)
                .eq('locale', locale)
                .eq('status', 'published')
                .maybeSingle(),
          supabase
            .from('vocabulary_taxonomy')
            .select('parts_of_speech,verb_groups,transitivities,adjective_types,themes,needs_review')
            .eq('content_item_id', contentItemId)
            .maybeSingle(),
        ]);
      if (!version) throw new Error('Versi materi lama belum dapat dimuat.');
      return {
        id: item.id,
        type: 'vocabulary',
        level: item.level,
        title: item.word ?? '',
        reading: item.reading,
        meanings: translation?.meanings ?? version.meanings,
        supportingText: null,
        taxonomy: taxonomy
          ? {
              partsOfSpeech: taxonomy.parts_of_speech,
              verbGroups: taxonomy.verb_groups,
              transitivities: taxonomy.transitivities,
              adjectiveTypes: taxonomy.adjective_types,
              themes: taxonomy.themes,
              needsReview: taxonomy.needs_review,
            }
          : null,
        examples: parseExamples(translation?.examples ?? version.examples),
        locale,
        isFallback: locale !== 'en' && !translation,
      };
    }

    if (item.content_type === 'kanji') {
      const [{ data: version }, { data: translation }] = await Promise.all([
        supabase
          .from('kanji')
          .select('meanings,onyomi,kunyomi,strokes,grade,frequency')
          .eq('content_item_id', contentItemId)
          .maybeSingle(),
        locale === 'en'
          ? Promise.resolve({ data: null })
          : supabase
              .from('kanji_translations')
              .select('meanings')
              .eq('content_item_id', contentItemId)
              .eq('locale', locale)
              .eq('status', 'published')
              .maybeSingle(),
      ]);
      if (!version) throw new Error('Versi kanji lama belum dapat dimuat.');
      return {
        id: item.id,
        type: 'kanji',
        level: item.level,
        title: item.character ?? '',
        reading: version.kunyomi[0] ?? version.onyomi[0] ?? null,
        meanings: translation?.meanings ?? version.meanings,
        supportingText: version.strokes ? `${version.strokes} strokes` : null,
        taxonomy: null,
        examples: [],
        onyomi: version.onyomi,
        kunyomi: version.kunyomi,
        strokes: version.strokes,
        grade: version.grade,
        frequency: version.frequency,
        locale,
        isFallback: locale !== 'en' && !translation,
      };
    }

    const [{ data: version }, { data: translation }] = await Promise.all([
      supabase
        .from('grammar')
        .select('meaning,formation,examples,tags,notes')
        .eq('content_item_id', contentItemId)
        .maybeSingle(),
      locale === 'en'
        ? Promise.resolve({ data: null })
        : supabase
            .from('grammar_translations')
            .select('meaning,formation,examples,tags,notes')
            .eq('content_item_id', contentItemId)
            .eq('locale', locale)
            .eq('status', 'published')
            .maybeSingle(),
    ]);
    if (!version) throw new Error('Versi grammar lama belum dapat dimuat.');
    return {
      id: item.id,
      type: 'grammar',
      level: item.level,
      title: item.pattern ?? '',
      reading: null,
      meanings: [translation?.meaning ?? version.meaning],
      supportingText: translation?.formation ?? version.formation,
      taxonomy: null,
      examples: parseExamples(translation?.examples ?? version.examples),
      formation: translation?.formation ?? version.formation,
      tags: translation?.tags ?? version.tags,
      notes: translation?.notes ?? version.notes,
      locale,
      isFallback: locale !== 'en' && !translation,
    };
  }

  const [{ data: version, error: versionError }, { data: taxonomy }] = await Promise.all([
    supabase
      .from('deck_vocabulary')
      .select('display,meanings_id,meanings_en,meanings_ko,examples,usage_frame')
      .eq('content_item_id', contentItemId)
      .maybeSingle(),
    supabase
      .from('vocabulary_taxonomy')
      .select('parts_of_speech,verb_groups,transitivities,adjective_types,themes,needs_review')
      .eq('content_item_id', contentItemId)
      .maybeSingle(),
  ]);
  if (versionError || !version) throw new Error('Versi vocabulary deck belum dapat dimuat.');

  const localizedMeanings =
    locale === 'id'
      ? version.meanings_id
      : locale === 'ko'
        ? version.meanings_ko
        : version.meanings_en;
  return {
    id: item.id,
    type: 'vocabulary',
    level: item.level,
    title: version.display || item.word || '',
    reading: item.reading,
    meanings: localizedMeanings.length ? localizedMeanings : version.meanings_id,
    supportingText: version.usage_frame,
    taxonomy: taxonomy
      ? {
          partsOfSpeech: taxonomy.parts_of_speech,
          verbGroups: taxonomy.verb_groups,
          transitivities: taxonomy.transitivities,
          adjectiveTypes: taxonomy.adjective_types,
          themes: taxonomy.themes,
          needsReview: taxonomy.needs_review,
        }
      : null,
    examples: parseExamples(version.examples),
    locale,
    isFallback: locale !== 'id' && !localizedMeanings.length,
  };
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
      'id,level,content_types,target_item_count,completed_item_count,correct_item_count,started_at,completed_at,session_mode,deck_id,study_direction',
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
          'id,level,content_types,target_item_count,completed_item_count,correct_item_count,started_at,completed_at,session_mode,deck_id,study_direction',
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
    .select('position,content_item_id,client_attempt_id,studied_at,card_direction')
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
  const [detail, { data: attempt, error: attemptError }] = await Promise.all([
    getLearningContentDetail(
      supabase,
      item.content_item_id,
      item.card_direction === 'production' ? 'id' : locale,
    ),
    supabase
      .from('quiz_attempts')
      .select('answer_text,is_correct,question_type')
      .eq('user_id', user.id)
      .eq('client_attempt_id', item.client_attempt_id)
      .maybeSingle(),
  ]);

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

  if (item.card_direction === 'production') {
    return {
      session,
      currentItem: {
        position: item.position,
        detail,
        phase: { name: 'production' },
      },
    };
  }

  const distractors = await getDistractorDetails(
    supabase,
    item.content_item_id,
    detail,
    locale,
  );
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
