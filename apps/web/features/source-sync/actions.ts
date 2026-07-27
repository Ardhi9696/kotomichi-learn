'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { sourceManifestSchema } from '@/features/source-sync/source-schema';
import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import type { Enums, Json } from '@/lib/supabase/database.types';

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const batchSchema = z.object({
  snapshotId: z.uuid(),
  contentType: z.enum(['vocabulary', 'kanji', 'grammar']),
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(250),
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Operasi sinkronisasi gagal.';
}

export async function createSourceSnapshot(
  metadata: Pick<
    z.infer<typeof sourceManifestSchema>,
    'source_version' | 'source_commit' | 'dataset_checksum'
  >,
): Promise<ActionResult<string>> {
  try {
    const parsed = sourceManifestSchema
      .pick({
        source_version: true,
        source_commit: true,
        dataset_checksum: true,
      })
      .parse(metadata);
    const { supabase } = await requireSuperadmin();
    const { data, error } = await supabase.rpc('create_source_snapshot', {
      p_source_version: parsed.source_version,
      p_source_commit: parsed.source_commit,
      p_dataset_checksum: parsed.dataset_checksum,
    });
    if (error || !data) throw new Error(error?.message ?? 'Snapshot gagal dibuat.');
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function importSourceBatch(input: {
  snapshotId: string;
  contentType: Enums<'content_type'>;
  items: Record<string, unknown>[];
}): Promise<ActionResult<number>> {
  try {
    const parsed = batchSchema.parse(input);
    const { supabase } = await requireSuperadmin();
    const { data, error } = await supabase.rpc('import_source_batch', {
      p_snapshot_id: parsed.snapshotId,
      p_content_type: parsed.contentType,
      p_items: parsed.items as Json,
    });
    if (error) throw new Error(error.message);
    return { ok: true, data: data ?? 0 };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function validateSourceSnapshot(
  snapshotId: string,
): Promise<ActionResult<Json>> {
  try {
    const parsedId = z.uuid().parse(snapshotId);
    const { supabase } = await requireSuperadmin();
    const { data, error } = await supabase.rpc('validate_source_snapshot', {
      p_snapshot_id: parsedId,
    });
    if (error || !data) throw new Error(error?.message ?? 'Validasi gagal.');
    revalidatePath('/admin/sources');
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function activateSourceSnapshot(formData: FormData): Promise<never> {
  const snapshotId = z.uuid().safeParse(formData.get('snapshot_id'));
  const confirmed = formData.get('confirmed') === 'yes';
  if (!snapshotId.success || !confirmed) {
    redirect('/admin/sources?error=Konfirmasi+aktivasi+snapshot+diperlukan');
  }

  const { supabase } = await requireSuperadmin();
  const { error } = await supabase.rpc('activate_source_snapshot', {
    p_snapshot_id: snapshotId.data,
  });
  if (error) {
    redirect(
      `/admin/sources?error=${encodeURIComponent('Snapshot belum dapat diaktifkan.')}`,
    );
  }

  revalidatePath('/', 'layout');
  redirect('/admin/sources?message=Snapshot+berhasil+diaktifkan');
}
