import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import type { Enums, Json } from '@/lib/supabase/database.types';

export type SnapshotDiff = {
  added: number;
  changed: number;
  unchanged: number;
  removed: number;
  moved_level: number;
  total: number;
};

export type SourceSnapshotRow = {
  id: string;
  sourceVersion: string;
  sourceCommit: string | null;
  status: Enums<'snapshot_status'>;
  checksum: string;
  itemCounts: Json;
  importedAt: string;
  activatedAt: string | null;
  diff: SnapshotDiff | null;
};

function asDiff(value: Json | null): SnapshotDiff | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const numberValue = (key: keyof SnapshotDiff) =>
    typeof value[key] === 'number' ? value[key] : 0;
  return {
    added: numberValue('added'),
    changed: numberValue('changed'),
    unchanged: numberValue('unchanged'),
    removed: numberValue('removed'),
    moved_level: numberValue('moved_level'),
    total: numberValue('total'),
  };
}

export async function getSourceSnapshots(): Promise<SourceSnapshotRow[]> {
  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase
    .from('source_snapshots')
    .select(
      'id,source_version,source_commit,status,dataset_checksum,item_counts,imported_at,activated_at',
    )
    .order('imported_at', { ascending: false })
    .limit(20);
  if (error) throw new Error('Riwayat snapshot belum dapat dimuat.');

  return Promise.all(
    (data ?? []).map(async (snapshot) => {
      const shouldDiff =
        snapshot.status === 'validated' || snapshot.status === 'archived';
      const diffResult = shouldDiff
        ? await supabase.rpc('source_snapshot_diff', {
            p_snapshot_id: snapshot.id,
          })
        : { data: null, error: null };

      return {
        id: snapshot.id,
        sourceVersion: snapshot.source_version,
        sourceCommit: snapshot.source_commit,
        status: snapshot.status,
        checksum: snapshot.dataset_checksum,
        itemCounts: snapshot.item_counts,
        importedAt: snapshot.imported_at,
        activatedAt: snapshot.activated_at,
        diff: diffResult.error ? null : asDiff(diffResult.data),
      };
    }),
  );
}

