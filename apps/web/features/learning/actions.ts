'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getContentDetail } from '@/features/catalog/queries';
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

  const contentResults = await Promise.all(
    result.data.contentTypes.map(async (contentType) => {
      const appliesVocabularyFilter = contentType === 'vocabulary';
      const { data, error } = await supabase.rpc('get_learning_candidates', {
        p_level: result.data.level,
        p_content_type: contentType,
        p_parts_of_speech:
          appliesVocabularyFilter && result.data.vocabularyPartOfSpeech !== 'all'
            ? [result.data.vocabularyPartOfSpeech]
            : [],
        p_verb_groups:
          appliesVocabularyFilter && result.data.vocabularyVerbGroup !== 'all'
            ? [result.data.vocabularyVerbGroup]
            : [],
        p_transitivities:
          appliesVocabularyFilter && result.data.vocabularyTransitivity !== 'all'
            ? [result.data.vocabularyTransitivity]
            : [],
        p_adjective_types:
          appliesVocabularyFilter && result.data.vocabularyAdjectiveType !== 'all'
            ? [result.data.vocabularyAdjectiveType]
            : [],
        p_themes:
          appliesVocabularyFilter && result.data.vocabularyTheme !== 'all'
            ? [result.data.vocabularyTheme]
            : [],
        p_limit: result.data.itemCount,
      });
      return {
        data: data?.map((item) => ({ id: item.content_item_id })) ?? null,
        error,
      };
    }),
  );

  if (contentResults.some(({ error }) => error)) {
    learningError('Materi sesi belum dapat disiapkan. Coba kembali.');
  }

  const contentItems: { id: string }[] = [];
  for (let index = 0; contentItems.length < result.data.itemCount; index += 1) {
    let foundItem = false;
    for (const contentResult of contentResults) {
      const item = contentResult.data?.[index];
      if (!item) continue;
      contentItems.push(item);
      foundItem = true;
      if (contentItems.length === result.data.itemCount) break;
    }
    if (!foundItem) break;
  }

  if (!contentItems.length) learningError('Belum ada materi aktif untuk pilihan tersebut.');

  const sessionId = crypto.randomUUID();
  const sessionContentTypes = result.data.contentTypes as ContentType[];
  const { error: sessionError } = await supabase.from('learning_sessions').insert({
    id: sessionId,
    user_id: user.id,
    level: result.data.level,
    content_types: sessionContentTypes,
    target_item_count: contentItems.length,
  });

  if (sessionError) learningError('Sesi belajar belum dapat dibuat. Coba kembali.');

  const { error: itemsError } = await supabase.from('learning_session_items').insert(
    contentItems.map((item, position) => ({
      session_id: sessionId,
      user_id: user.id,
      content_item_id: item.id,
      position,
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
  const { data: item, error: itemError } = await supabase
    .from('learning_session_items')
    .select('content_item_id,client_attempt_id,completed_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('position', position)
    .maybeSingle();

  if (itemError || !item || item.completed_at) {
    learningError('Item kuis tidak tersedia.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('content_locale')
    .eq('id', user.id)
    .maybeSingle();
  const localeValue = profile?.content_locale;
  const locale: Locale = isLocale(localeValue) ? localeValue : 'en';
  const detail = await getContentDetail(item.content_item_id, locale);
  const expectedQuestionType = getQuizQuestionType(detail, position);

  if (submissionResult.data.questionType !== expectedQuestionType) {
    learningError('Jenis pertanyaan tidak sesuai dengan sesi.');
  }

  const isCorrect = evaluateQuizAnswer(
    detail,
    expectedQuestionType,
    submissionResult.data.answer,
  );
  const { error: attemptError } = await supabase.from('quiz_attempts').insert({
    client_attempt_id: item.client_attempt_id,
    session_id: sessionId,
    user_id: user.id,
    content_item_id: item.content_item_id,
    question_type: expectedQuestionType,
    answer_text: submissionResult.data.answer,
    is_correct: isCorrect,
    response_time_ms: submissionResult.data.responseTimeMs,
  });

  if (attemptError && attemptError.code !== '23505') {
    learningError('Jawaban kuis belum dapat disimpan.');
  }

  const { error: studiedError } = await supabase
    .from('learning_session_items')
    .update({ studied_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('position', position)
    .is('studied_at', null)
    .is('completed_at', null);

  if (studiedError) learningError('Progres kuis belum dapat disimpan.');

  revalidatePath(`/learn/${sessionId}`);
  redirect(`/learn/${sessionId}`);
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

  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('id,is_correct')
    .eq('user_id', user.id)
    .eq('client_attempt_id', item.client_attempt_id)
    .maybeSingle();

  if (attemptError || !attempt) learningError('Selesaikan kuis sebelum melanjutkan.');
  if (!isReviewRatingAllowed(ratingResult.data, attempt.is_correct)) {
    learningError('Jawaban salah hanya dapat dinilai Lupa atau Sulit.');
  }

  const { data: currentProgress, error: progressError } = await supabase
    .from('learning_progress')
    .select(
      'status,attempts_count,correct_count,review_count,interval_days,ease_factor,mastered_at',
    )
    .eq('user_id', user.id)
    .eq('content_item_id', item.content_item_id)
    .maybeSingle();

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

  const completedAt = new Date().toISOString();
  const [
    { count: completedItemCount, error: completedCountError },
    { count: correctItemCount, error: correctCountError },
    { data: session, error: sessionError },
  ] = await Promise.all([
    supabase
      .from('learning_session_items')
      .select('session_id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('is_correct', true),
    supabase
      .from('learning_sessions')
      .select('target_item_count')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (completedCountError || correctCountError || sessionError || !session) {
    learningError('Ringkasan sesi belum dapat diperbarui.');
  }

  const completedCount = completedItemCount ?? 0;
  const isComplete = completedCount >= session.target_item_count;
  const { error: sessionUpdateError } = await supabase
    .from('learning_sessions')
    .update({
      completed_item_count: completedCount,
      correct_item_count: correctItemCount ?? 0,
      completed_at: isComplete ? completedAt : null,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (sessionUpdateError) learningError('Ringkasan sesi belum dapat disimpan.');

  revalidatePath('/dashboard');
  revalidatePath('/learn');
  revalidatePath(`/learn/${sessionId}`);
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
