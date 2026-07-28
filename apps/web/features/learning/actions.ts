'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isLocale, type ContentType, type Locale } from '@/features/catalog/types';
import {
  evaluateQuizAnswer,
  getQuizQuestionType,
  quizSubmissionSchema,
} from '@/features/learning/quiz';
import {
  createLearningSessionSchema,
  learningSessionIdSchema,
  sessionItemPositionSchema,
} from '@/features/learning/session-schema';
import { getLearningContentDetail } from '@/features/learning/queries';
import {
  calculateReviewUpdate,
  isReviewRatingAllowed,
} from '@/features/learning/spaced-repetition';
import { requireUser } from '@/lib/auth/require-user';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function learningError(message: string): never {
  redirect(`/learn?error=${encodeURIComponent(message)}`);
}

const reviewRatingSchema = z.enum(['forgot', 'hard', 'good', 'easy']);
const reviewItemCountSchema = z.coerce.number().int().min(1).max(30);

export async function createLearningSession(formData: FormData): Promise<never> {
  const contentTypes = [
    ...new Set(
      formData
        .getAll('content_type')
        .filter((value): value is string => typeof value === 'string'),
    ),
  ];
  const result = createLearningSessionSchema.safeParse({
    deckId: formString(formData, 'deck_id'),
    studyDirection: formString(formData, 'study_direction'),
    level: formString(formData, 'level'),
    contentTypes,
    itemCount: formString(formData, 'item_count'),
    vocabularyPartOfSpeech: formString(formData, 'vocabulary_pos') || 'all',
    vocabularyVerbGroup:
      formString(formData, 'vocabulary_verb_group') || 'all',
    vocabularyTransitivity:
      formString(formData, 'vocabulary_transitivity') || 'all',
    vocabularyAdjectiveType:
      formString(formData, 'vocabulary_adjective_type') || 'all',
    vocabularyTheme: formString(formData, 'vocabulary_theme') || 'all',
  });

  if (!result.success) {
    learningError(result.error.issues[0]?.message ?? 'Periksa kembali pilihan sesi.');
  }

  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.onboarding_completed_at) {
    redirect('/onboarding');
  }

  const { data: candidates, error: candidatesError } = await supabase.rpc(
    'get_deck_learning_candidates',
    {
      p_deck_id: result.data.deckId,
      p_level: result.data.level,
      p_adjective_types:
        result.data.vocabularyAdjectiveType === 'all'
          ? []
          : [result.data.vocabularyAdjectiveType],
      p_limit: result.data.itemCount,
    },
  );

  if (candidatesError) {
    learningError('Materi sesi belum dapat disiapkan. Coba kembali.');
  }

  const contentItems = (candidates ?? []).map((item) => ({ id: item.content_item_id }));

  if (!contentItems.length) learningError('Belum ada materi aktif untuk pilihan tersebut.');

  const sessionId = crypto.randomUUID();
  const sessionContentTypes = result.data.contentTypes as ContentType[];
  const { error: sessionError } = await supabase.from('learning_sessions').insert({
    id: sessionId,
    user_id: user.id,
    level: result.data.level,
    content_types: sessionContentTypes.includes('vocabulary')
      ? ['vocabulary']
      : sessionContentTypes,
    deck_id: result.data.deckId,
    study_direction: result.data.studyDirection,
    target_item_count: contentItems.length,
  });

  if (sessionError) learningError('Sesi belajar belum dapat dibuat. Coba kembali.');

  const { error: itemsError } = await supabase.from('learning_session_items').insert(
    contentItems.map((item, position) => ({
      session_id: sessionId,
      user_id: user.id,
      content_item_id: item.id,
      position,
      card_direction:
        result.data.studyDirection === 'mixed'
          ? position % 2 === 0 ? 'recognition' : 'production'
          : result.data.studyDirection,
    })),
  );

  if (itemsError) {
    await supabase.from('learning_sessions').delete().eq('id', sessionId).eq('user_id', user.id);
    learningError('Materi sesi belum dapat disimpan. Coba kembali.');
  }

  revalidatePath('/dashboard');
  revalidatePath('/learn');
  redirect(`/learn/${sessionId}`);
}

export async function submitQuiz(
  rawSessionId: string,
  rawPosition: number,
  formData: FormData,
): Promise<never> {
  const sessionIdResult = learningSessionIdSchema.safeParse(rawSessionId);
  const positionResult = sessionItemPositionSchema.safeParse(rawPosition);
  const submissionResult = quizSubmissionSchema.safeParse({
    questionType: formString(formData, 'question_type'),
    answer: formString(formData, 'answer'),
    responseTimeMs: formString(formData, 'response_time_ms'),
  });

  if (!sessionIdResult.success || !positionResult.success || !submissionResult.success) {
    learningError(
      submissionResult.error?.issues[0]?.message ?? 'Jawaban kuis tidak dapat diproses.',
    );
  }

  const sessionId = sessionIdResult.data;
  const position = positionResult.data;
  const { supabase, user } = await requireUser();
  const [
    { data: item, error: itemError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase
      .from('learning_session_items')
      .select('content_item_id,client_attempt_id,completed_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('position', position)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('content_locale')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  if (itemError || !item || item.completed_at) {
    learningError('Item kuis tidak tersedia.');
  }
  if (profileError) learningError('Bahasa konten belum dapat dimuat.');
  const localeValue = profile?.content_locale;
  const locale: Locale = isLocale(localeValue) ? localeValue : 'en';
  const detail = await getLearningContentDetail(supabase, item.content_item_id, locale);
  const expectedQuestionType = getQuizQuestionType(detail, position);

  if (submissionResult.data.questionType !== expectedQuestionType) {
    learningError('Jenis pertanyaan tidak sesuai dengan sesi.');
  }

  const isCorrect = evaluateQuizAnswer(
    detail,
    expectedQuestionType,
    submissionResult.data.answer,
  );
  const [{ error: attemptError }, { error: studiedError }] = await Promise.all([
    supabase.from('quiz_attempts').insert({
      client_attempt_id: item.client_attempt_id,
      session_id: sessionId,
      user_id: user.id,
      content_item_id: item.content_item_id,
      question_type: expectedQuestionType,
      answer_text: submissionResult.data.answer,
      is_correct: isCorrect,
      response_time_ms: submissionResult.data.responseTimeMs,
    }),
    supabase
      .from('learning_session_items')
      .update({ studied_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('position', position)
      .is('studied_at', null)
      .is('completed_at', null),
  ]);

  if (attemptError && attemptError.code !== '23505') {
    learningError('Jawaban kuis belum dapat disimpan.');
  }

  if (studiedError) learningError('Progres kuis belum dapat disimpan.');

  redirect(`/learn/${sessionId}`);
}

export async function rateProductionItem(
  rawSessionId: string,
  rawPosition: number,
  formData: FormData,
): Promise<never> {
  const sessionId = learningSessionIdSchema.safeParse(rawSessionId);
  const position = sessionItemPositionSchema.safeParse(rawPosition);
  const rating = reviewRatingSchema.safeParse(formString(formData, 'rating'));
  if (!sessionId.success || !position.success || !rating.success) {
    learningError('Penilaian Production tidak valid.');
  }

  const { supabase, user } = await requireUser();
  const { data: item, error } = await supabase
    .from('learning_session_items')
    .select('content_item_id,client_attempt_id,card_direction,completed_at')
    .eq('session_id', sessionId.data)
    .eq('user_id', user.id)
    .eq('position', position.data)
    .maybeSingle();
  if (error || !item || item.completed_at || item.card_direction !== 'production') {
    learningError('Kartu Production tidak tersedia.');
  }

  const isCorrect = rating.data !== 'forgot';
  const [{ error: attemptError }, { error: studiedError }] = await Promise.all([
    supabase.from('quiz_attempts').insert({
      client_attempt_id: item.client_attempt_id,
      session_id: sessionId.data,
      user_id: user.id,
      content_item_id: item.content_item_id,
      question_type: 'production_recall',
      answer_text: null,
      is_correct: isCorrect,
      response_time_ms: 0,
    }),
    supabase
      .from('learning_session_items')
      .update({ studied_at: new Date().toISOString() })
      .eq('session_id', sessionId.data)
      .eq('user_id', user.id)
      .eq('position', position.data),
  ]);
  if (attemptError && attemptError.code !== '23505') {
    learningError('Penilaian Production belum dapat disimpan.');
  }
  if (studiedError) learningError('Progres Production belum dapat disimpan.');

  return completeLearningItem(
    sessionId.data,
    position.data,
    formData,
  );
}

export async function completeLearningItem(
  rawSessionId: string,
  rawPosition: number,
  formData: FormData,
): Promise<never> {
  const sessionIdResult = learningSessionIdSchema.safeParse(rawSessionId);
  const positionResult = sessionItemPositionSchema.safeParse(rawPosition);
  const ratingResult = reviewRatingSchema.safeParse(formString(formData, 'rating'));
  if (!sessionIdResult.success || !positionResult.success || !ratingResult.success) {
    learningError('Rating review tidak valid.');
  }

  const sessionId = sessionIdResult.data;
  const position = positionResult.data;
  const { supabase, user } = await requireUser();
  const { data: item, error: itemError } = await supabase
    .from('learning_session_items')
    .select('client_attempt_id,content_item_id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('position', position)
    .maybeSingle();

  if (itemError || !item) learningError('Item sesi tidak ditemukan.');

  const [
    { data: attempt, error: attemptError },
    { data: currentProgress, error: progressError },
  ] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('id,is_correct')
      .eq('user_id', user.id)
      .eq('client_attempt_id', item.client_attempt_id)
      .maybeSingle(),
    supabase
      .from('learning_progress')
      .select(
        'status,attempts_count,correct_count,review_count,interval_days,ease_factor,mastered_at',
      )
      .eq('user_id', user.id)
      .eq('content_item_id', item.content_item_id)
      .maybeSingle(),
  ]);

  if (attemptError || !attempt) learningError('Selesaikan kuis sebelum melanjutkan.');
  if (!isReviewRatingAllowed(ratingResult.data, attempt.is_correct)) {
    learningError('Jawaban salah hanya dapat dinilai Lupa atau Sulit.');
  }

  if (progressError) learningError('Progres sebelumnya belum dapat dimuat.');

  const reviewUpdate = calculateReviewUpdate(
    currentProgress,
    ratingResult.data,
    attempt.is_correct,
  );
  const { error: applyError } = await supabase.rpc('apply_learning_review', {
    p_session_id: sessionId,
    p_position: position,
    p_rating: ratingResult.data,
    p_status: reviewUpdate.status,
    p_attempts_count: reviewUpdate.attempts_count,
    p_correct_count: reviewUpdate.correct_count,
    p_review_count: reviewUpdate.review_count,
    p_interval_days: reviewUpdate.interval_days,
    p_ease_factor: reviewUpdate.ease_factor,
    p_next_review_at: reviewUpdate.nextReviewAt,
    p_mastered_at: reviewUpdate.mastered_at,
  });

  if (applyError) learningError('Jadwal review belum dapat disimpan.');

  revalidatePath('/dashboard');
  revalidatePath('/learn');
  redirect(`/learn/${sessionId}`);
}

export async function createReviewSession(formData: FormData): Promise<never> {
  const countResult = reviewItemCountSchema.safeParse(formString(formData, 'item_count'));
  if (!countResult.success) learningError('Jumlah item review tidak valid.');

  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('target_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile) learningError('Profil review belum dapat dimuat.');

  const { data: dueProgress, error: dueError } = await supabase
    .from('learning_progress')
    .select('content_item_id,content_items!inner(level,content_type)')
    .eq('user_id', user.id)
    .eq('content_items.level', profile.target_level)
    .in('status', ['learning', 'review'])
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at')
    .limit(countResult.data);

  if (dueError) learningError('Antrean review belum dapat disiapkan.');
  if (!dueProgress.length) redirect('/review?message=Tidak+ada+review+yang+jatuhtempo.');

  const sessionId = crypto.randomUUID();
  const contentTypes = [
    ...new Set(dueProgress.map((row) => row.content_items.content_type)),
  ];
  const { error: sessionError } = await supabase.from('learning_sessions').insert({
    id: sessionId,
    user_id: user.id,
    level: profile.target_level,
    content_types: contentTypes,
    target_item_count: dueProgress.length,
    session_mode: 'review',
  });
  if (sessionError) learningError('Sesi review belum dapat dibuat.');

  const { error: itemsError } = await supabase.from('learning_session_items').insert(
    dueProgress.map((row, position) => ({
      session_id: sessionId,
      user_id: user.id,
      content_item_id: row.content_item_id,
      position,
    })),
  );
  if (itemsError) {
    await supabase.from('learning_sessions').delete().eq('id', sessionId).eq('user_id', user.id);
    learningError('Item review belum dapat disimpan.');
  }

  revalidatePath('/review');
  redirect(`/learn/${sessionId}`);
}
