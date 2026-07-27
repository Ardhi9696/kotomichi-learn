'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  contentActiveSchema,
  editorialContentSchema,
} from '@/features/editor/content-schema';
import { requireEditorial } from '@/lib/auth/require-editorial';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function formStrings(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string');
}

function editorError(contentItemId: string, message: string): never {
  const path = contentItemId ? `/editor/${encodeURIComponent(contentItemId)}` : '/editor/new';
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function saveEditorialContent(formData: FormData): Promise<never> {
  const rawContentItemId = formString(formData, 'content_item_id');
  const result = editorialContentSchema.safeParse({
    contentItemId: rawContentItemId,
    contentType: formString(formData, 'content_type'),
    level: formString(formData, 'level'),
    title: formString(formData, 'title'),
    reading: formString(formData, 'reading'),
    meanings: formString(formData, 'meanings'),
    examples: formString(formData, 'examples'),
    formation: formString(formData, 'formation'),
    tags: formString(formData, 'tags'),
    notes: formString(formData, 'notes'),
    onyomi: formString(formData, 'onyomi'),
    kunyomi: formString(formData, 'kunyomi'),
    strokes: formString(formData, 'strokes'),
    grade: formString(formData, 'grade'),
    frequency: formString(formData, 'frequency'),
    partsOfSpeech: formStrings(formData, 'parts_of_speech'),
    verbGroups: formStrings(formData, 'verb_groups'),
    transitivities: formStrings(formData, 'transitivities'),
    adjectiveTypes: formStrings(formData, 'adjective_types'),
    themes: formStrings(formData, 'themes'),
  });
  if (!result.success) {
    editorError(
      rawContentItemId,
      result.error.issues[0]?.message ?? 'Data materi tidak valid.',
    );
  }

  const { supabase } = await requireEditorial();
  const { data: contentItemId, error } = await supabase.rpc('save_editorial_content', {
    p_content_item_id: result.data.contentItemId,
    p_content_type: result.data.contentType,
    p_level: result.data.level,
    p_title: result.data.title,
    p_reading: result.data.reading,
    p_meanings: result.data.meanings,
    p_examples: result.data.examples,
    p_formation: result.data.formation,
    p_tags: result.data.tags,
    p_notes: result.data.notes,
    p_onyomi: result.data.onyomi,
    p_kunyomi: result.data.kunyomi,
    p_strokes: result.data.strokes,
    p_grade: result.data.grade,
    p_frequency: result.data.frequency,
  });

  if (error || !contentItemId) {
    const message =
      error?.code === '23505'
        ? 'Materi dengan identitas tersebut sudah tersedia.'
        : 'Materi belum dapat disimpan.';
    editorError(rawContentItemId, message);
  }

  if (result.data.contentType === 'vocabulary') {
    const { error: taxonomyError } = await supabase.rpc(
      'save_vocabulary_taxonomy',
      {
        p_content_item_id: contentItemId,
        p_parts_of_speech: result.data.partsOfSpeech,
        p_verb_groups: result.data.verbGroups,
        p_transitivities: result.data.transitivities,
        p_adjective_types: result.data.adjectiveTypes,
        p_themes: result.data.themes,
      },
    );
    if (taxonomyError) {
      editorError(contentItemId, 'Materi tersimpan, tetapi klasifikasi belum dapat disimpan.');
    }
  }

  revalidatePath('/catalog');
  revalidatePath(`/catalog/${contentItemId}`);
  revalidatePath('/editor');
  redirect(
    `/editor/${contentItemId}?message=${encodeURIComponent(
      result.data.contentItemId
        ? 'Perubahan materi berhasil disimpan.'
        : 'Materi baru berhasil dibuat.',
    )}`,
  );
}

export async function setContentActive(formData: FormData): Promise<never> {
  const result = contentActiveSchema.safeParse({
    contentItemId: formString(formData, 'content_item_id'),
    isActive: formString(formData, 'is_active'),
  });
  if (!result.success) redirect('/editor?error=Materi+tidak+valid.');

  const { supabase } = await requireEditorial();
  const { data: changed, error } = await supabase.rpc('set_content_active', {
    p_content_item_id: result.data.contentItemId,
    p_is_active: result.data.isActive,
  });
  if (error || !changed) redirect('/editor?error=Status+materi+belum+dapat+diubah.');

  revalidatePath('/catalog');
  revalidatePath(`/catalog/${result.data.contentItemId}`);
  revalidatePath('/editor');
  redirect(
    `/editor?message=${encodeURIComponent(
      result.data.isActive ? 'Materi berhasil dipulihkan.' : 'Materi berhasil diarsipkan.',
    )}`,
  );
}
