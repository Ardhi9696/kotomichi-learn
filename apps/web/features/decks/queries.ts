import { notFound } from 'next/navigation';
import { z } from 'zod';

import type { DeckImportRow } from '@/features/decks/deck-tsv';
import { requireEditorial } from '@/lib/auth/require-editorial';
import { requireUser } from '@/lib/auth/require-user';
import { createPublicClient } from '@/lib/supabase/public';

export async function getDeckLibrary() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('decks')
    .select('id,title,description,kind,updated_at')
    .eq('visibility', 'public')
    .eq('review_status', 'approved')
    .is('archived_at', null)
    .order('kind')
    .order('updated_at', { ascending: false });
  if (error) throw new Error('Library deck belum dapat dimuat.');
  return data;
}

export async function getMyDecks() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('decks')
    .select(
      'id,title,description,visibility,review_status,active_import_id,updated_at,archived_at',
    )
    .eq('owner_id', user.id)
    .is('archived_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw new Error('Deck milikmu belum dapat dimuat.');
  return { decks: data, userId: user.id };
}

export async function getDeckImportData(rawDeckId: string) {
  const deckId = z.uuid().safeParse(rawDeckId);
  if (!deckId.success) notFound();
  const { supabase, user } = await requireUser();
  const { data: deck, error } = await supabase
    .from('decks')
    .select('id,title,visibility,review_status,active_import_id,owner_id')
    .eq('id', deckId.data)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (error) throw new Error('Deck belum dapat dimuat.');
  if (!deck) notFound();

  let currentRows: DeckImportRow[] = [];
  if (deck.active_import_id) {
    const { data: activeImport, error: importError } = await supabase
      .from('deck_imports')
      .select('normalized_payload')
      .eq('id', deck.active_import_id)
      .maybeSingle();
    if (importError) throw new Error('Versi deck aktif belum dapat dimuat.');
    if (Array.isArray(activeImport?.normalized_payload)) {
      currentRows = activeImport.normalized_payload as unknown as DeckImportRow[];
    }
  }

  return { deck, currentRows, userId: user.id };
}

export async function getDeckReviewQueue() {
  const { supabase, roles } = await requireEditorial();
  if (!roles.some((role) => ['reviewer', 'admin', 'superadmin'].includes(role))) notFound();

  const { data, error } = await supabase
    .from('deck_imports')
    .select(
      'id,deck_id,checksum,diff,row_errors,row_warnings,created_at,decks!inner(title,owner_id,rights_attestation)',
    )
    .eq('status', 'pending')
    .order('created_at');
  if (error) throw new Error('Antrean review deck belum dapat dimuat.');
  return data;
}

export async function getStudyDecks() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('decks')
    .select('id,title,kind')
    .is('archived_at', null)
    .or(`visibility.eq.public,owner_id.eq.${user.id}`)
    .order('kind')
    .order('title');
  if (error) throw new Error('Pilihan deck belum dapat dimuat.');
  return data;
}
