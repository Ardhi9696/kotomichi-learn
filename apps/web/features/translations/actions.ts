'use server';

import { createHash } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  reviewTranslationSchema,
  translationDraftSchema,
  translationIdentitySchema,
} from '@/features/translations/translation-schema';
import { requireEditorial } from '@/lib/auth/require-editorial';
import type { Json } from '@/lib/supabase/database.types';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function translationPath(id: string, locale: string, kind?: string, message?: string) {
  const params = new URLSearchParams({ locale });
  if (kind && message) params.set(kind, message);
  return `/translations/${encodeURIComponent(id)}?${params.toString()}`;
}

function parseIdentity(formData: FormData) {
  return {
    contentItemId: formString(formData, 'content_item_id'),
    contentType: formString(formData, 'content_type'),
    locale: formString(formData, 'locale'),
  };
}

export async function saveTranslationDraft(formData: FormData): Promise<never> {
  const raw = parseIdentity(formData);
  const result = translationDraftSchema.safeParse({
    ...raw,
    meanings: formString(formData, 'meanings'),
    examples: formString(formData, 'examples'),
    formation: formString(formData, 'formation'),
    tags: formString(formData, 'tags'),
    notes: formString(formData, 'notes'),
  });
  if (!result.success) {
    redirect(
      translationPath(
        raw.contentItemId,
        raw.locale,
        'error',
        result.error.issues[0]?.message ?? 'Draft translation tidak valid.',
      ),
    );
  }

  const { supabase, user } = await requireEditorial();
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('current_source_fingerprint,updated_at')
    .eq('id', result.data.contentItemId)
    .eq('content_type', result.data.contentType)
    .maybeSingle();
  if (itemError || !item) {
    redirect(
      translationPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Materi sumber tidak ditemukan.',
      ),
    );
  }

  const fingerprint =
    item.current_source_fingerprint ??
    createHash('sha256')
      .update(`${result.data.contentItemId}:${item.updated_at}`)
      .digest('hex');
  const common = {
    content_item_id: result.data.contentItemId,
    locale: result.data.locale,
    status: 'draft' as const,
    source_fingerprint: fingerprint,
    editor_id: user.id,
    reviewer_id: null,
    review_notes: null,
    reviewed_at: null,
    published_at: null,
    submitted_at: null,
  };

  let error;
  if (result.data.contentType === 'vocabulary') {
    ({ error } = await supabase.from('vocab_translations').upsert(
      {
        ...common,
        meanings: result.data.meanings,
        examples: result.data.examples as Json,
      },
      { onConflict: 'content_item_id,locale' },
    ));
  } else if (result.data.contentType === 'kanji') {
    ({ error } = await supabase.from('kanji_translations').upsert(
      { ...common, meanings: result.data.meanings },
      { onConflict: 'content_item_id,locale' },
    ));
  } else {
    ({ error } = await supabase.from('grammar_translations').upsert(
      {
        ...common,
        meaning: result.data.meanings[0] ?? '',
        formation: result.data.formation,
        examples: result.data.examples as Json,
        tags: result.data.tags,
        notes: result.data.notes,
      },
      { onConflict: 'content_item_id,locale' },
    ));
  }

  if (error) {
    redirect(
      translationPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Draft belum dapat disimpan. Translation published hanya dapat diubah reviewer.',
      ),
    );
  }
  revalidatePath('/translations');
  revalidatePath(`/catalog/${result.data.contentItemId}`);
  redirect(
    translationPath(
      result.data.contentItemId,
      result.data.locale,
      'message',
      'Draft translation berhasil disimpan.',
    ),
  );
}

export async function submitTranslationReview(formData: FormData): Promise<never> {
  const result = translationIdentitySchema.safeParse(parseIdentity(formData));
  if (!result.success) redirect('/translations?error=Translation+tidak+valid.');
  const { supabase } = await requireEditorial();
  const table =
    result.data.contentType === 'vocabulary'
      ? 'vocab_translations'
      : result.data.contentType === 'kanji'
        ? 'kanji_translations'
        : 'grammar_translations';
  const { data, error } = await supabase
    .from(table)
    .update({ submitted_at: new Date().toISOString() })
    .eq('content_item_id', result.data.contentItemId)
    .eq('locale', result.data.locale)
    .in('status', ['draft', 'needs_review'])
    .select('id')
    .maybeSingle();
  if (error || !data) {
    redirect(
      translationPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Simpan draft sebelum mengirim review.',
      ),
    );
  }
  revalidatePath('/translations');
  redirect(
    translationPath(
      result.data.contentItemId,
      result.data.locale,
      'message',
      'Translation sudah masuk antrean review.',
    ),
  );
}

export async function reviewTranslation(formData: FormData): Promise<never> {
  const result = reviewTranslationSchema.safeParse({
    ...parseIdentity(formData),
    status: formString(formData, 'status'),
    reviewNotes: formString(formData, 'review_notes'),
  });
  if (!result.success) redirect('/translations?error=Review+tidak+valid.');
  const { supabase, user, canReviewTranslations } = await requireEditorial();
  if (!canReviewTranslations) {
    redirect(
      translationPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Review memerlukan role reviewer atau admin.',
      ),
    );
  }
  const table =
    result.data.contentType === 'vocabulary'
      ? 'vocab_translations'
      : result.data.contentType === 'kanji'
        ? 'kanji_translations'
        : 'grammar_translations';
  const reviewed =
    result.data.status === 'reviewed' || result.data.status === 'published';
  const { data, error } = await supabase
    .from(table)
    .update({
      status: result.data.status,
      reviewer_id: user.id,
      review_notes: result.data.reviewNotes || null,
      reviewed_at: reviewed ? new Date().toISOString() : null,
      published_at:
        result.data.status === 'published' ? new Date().toISOString() : null,
      submitted_at: null,
    })
    .eq('content_item_id', result.data.contentItemId)
    .eq('locale', result.data.locale)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    redirect(
      translationPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Status translation belum dapat diperbarui.',
      ),
    );
  }
  revalidatePath('/translations');
  revalidatePath(`/catalog/${result.data.contentItemId}`);
  redirect(
    translationPath(
      result.data.contentItemId,
      result.data.locale,
      'message',
      'Status translation berhasil diperbarui.',
    ),
  );
}
