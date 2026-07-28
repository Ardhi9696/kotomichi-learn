'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { requireEditorial } from '@/lib/auth/require-editorial';

const uuidSchema = z.uuid();
const deckSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000),
});

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry : '';
}

function deckError(message: string): never {
  redirect(`/decks?error=${encodeURIComponent(message)}`);
}

export async function createDeck(formData: FormData): Promise<never> {
  const parsed = deckSchema.safeParse({
    title: value(formData, 'title'),
    description: value(formData, 'description'),
  });
  if (!parsed.success) deckError(parsed.error.issues[0]?.message ?? 'Data deck tidak valid.');

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('decks')
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      kind: 'user',
      visibility: 'private',
      review_status: 'draft',
    })
    .select('id')
    .single();

  if (error) deckError('Deck belum dapat dibuat.');
  redirect(`/decks/import?deck=${data.id}`);
}

export async function archiveDeck(rawDeckId: string): Promise<never> {
  const deckId = uuidSchema.safeParse(rawDeckId);
  if (!deckId.success) deckError('Deck tidak valid.');

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from('decks')
    .update({
      archived_at: new Date().toISOString(),
      visibility: 'private',
      review_status: 'rejected',
    })
    .eq('id', deckId.data)
    .eq('owner_id', user.id);
  if (error) deckError('Deck belum dapat diarsipkan.');

  revalidatePath('/decks');
  redirect('/decks?message=Deck+diarsipkan');
}

export async function submitDeckPublication(
  rawDeckId: string,
  rawImportId: string,
  formData: FormData,
): Promise<never> {
  const deckId = uuidSchema.safeParse(rawDeckId);
  const importId = uuidSchema.safeParse(rawImportId);
  const attestation = value(formData, 'attestation').trim();
  if (!deckId.success || !importId.success || attestation.length < 20) {
    deckError('Pernyataan hak konten minimal 20 karakter.');
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc('submit_deck_for_review', {
    p_deck_id: deckId.data,
    p_import_id: importId.data,
    p_attestation: attestation,
  });
  if (error) deckError('Deck belum dapat diajukan untuk review.');

  revalidatePath('/decks');
  revalidatePath('/decks/review');
  redirect('/decks?message=Deck+diajukan+untuk+review');
}

export async function approveDeckImport(rawImportId: string): Promise<never> {
  const importId = uuidSchema.safeParse(rawImportId);
  if (!importId.success) deckError('Versi impor tidak valid.');

  const { supabase, roles } = await requireEditorial();
  if (!roles.some((role) => ['reviewer', 'admin', 'superadmin'].includes(role))) {
    deckError('Akses reviewer diperlukan.');
  }
  const { error } = await supabase.rpc('apply_deck_import', {
    p_import_id: importId.data,
  });
  if (error) deckError(`Versi belum dapat disetujui: ${error.message}`);

  revalidatePath('/decks');
  revalidatePath('/decks/review');
  redirect('/decks/review?message=Versi+deck+disetujui');
}

export async function rejectDeckImport(
  rawImportId: string,
  formData: FormData,
): Promise<never> {
  const importId = uuidSchema.safeParse(rawImportId);
  if (!importId.success) deckError('Versi impor tidak valid.');

  const { supabase, roles } = await requireEditorial();
  if (!roles.some((role) => ['reviewer', 'admin', 'superadmin'].includes(role))) {
    deckError('Akses reviewer diperlukan.');
  }
  const { error } = await supabase.rpc('reject_deck_import', {
    p_import_id: importId.data,
    p_notes: value(formData, 'notes').trim(),
  });
  if (error) deckError('Versi belum dapat ditolak.');

  revalidatePath('/decks/review');
  redirect('/decks/review?message=Versi+deck+ditolak');
}
