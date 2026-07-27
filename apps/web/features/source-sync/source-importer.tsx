'use client';

import { useState } from 'react';

import {
  createSourceSnapshot,
  importSourceBatch,
  validateSourceSnapshot,
} from '@/features/source-sync/actions';
import {
  sourceManifestSchema,
} from '@/features/source-sync/source-schema';

const BATCH_SIZE = 250;

type ImportState =
  | { kind: 'idle'; message: string }
  | { kind: 'working'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function SourceImporter() {
  const [state, setState] = useState<ImportState>({
    kind: 'idle',
    message: 'Pilih manifest JSON yang sudah dinormalisasi.',
  });

  async function importType(
    snapshotId: string,
    contentType: 'vocabulary' | 'kanji' | 'grammar',
    items: Record<string, unknown>[],
    completedBefore: number,
    total: number,
  ) {
    for (let start = 0; start < items.length; start += BATCH_SIZE) {
      const batch = items.slice(start, start + BATCH_SIZE);
      setState({
        kind: 'working',
        message: `Mengimpor ${completedBefore + start}/${total} item…`,
      });
      const result = await importSourceBatch({
        snapshotId,
        contentType,
        items: batch,
      });
      if (!result.ok) throw new Error(result.error);
    }
  }

  async function handleFile(file: File) {
    setState({ kind: 'working', message: 'Memvalidasi manifest di browser…' });

    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const manifest = sourceManifestSchema.parse(raw);
      const total =
        manifest.vocabulary.length + manifest.kanji.length + manifest.grammar.length;
      const created = await createSourceSnapshot({
        source_version: manifest.source_version,
        source_commit: manifest.source_commit,
        dataset_checksum: manifest.dataset_checksum,
      });
      if (!created.ok) throw new Error(created.error);

      await importType(
        created.data,
        'vocabulary',
        manifest.vocabulary as Record<string, unknown>[],
        0,
        total,
      );
      await importType(
        created.data,
        'kanji',
        manifest.kanji as Record<string, unknown>[],
        manifest.vocabulary.length,
        total,
      );
      await importType(
        created.data,
        'grammar',
        manifest.grammar as Record<string, unknown>[],
        manifest.vocabulary.length + manifest.kanji.length,
        total,
      );

      const validated = await validateSourceSnapshot(created.data);
      if (!validated.ok) throw new Error(validated.error);
      const validation = validated.data as Record<string, unknown>;
      if (validation.valid !== true) {
        throw new Error(String(validation.error ?? 'Snapshot tidak lolos validasi.'));
      }

      setState({
        kind: 'success',
        message: `${total.toLocaleString('id-ID')} item berhasil diimpor dan divalidasi. Muat ulang halaman untuk melihat diff.`,
      });
    } catch (error) {
      setState({
        kind: 'error',
        message:
          error instanceof Error ? error.message : 'Manifest belum dapat diimpor.',
      });
    }
  }

  return (
    <div>
      <label className="grid cursor-pointer gap-2 text-sm font-semibold">
        Manifest snapshot (.json)
        <input
          accept="application/json,.json"
          className="rounded-xl border border-border bg-background px-4 py-3 font-normal"
          disabled={state.kind === 'working'}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
          type="file"
        />
      </label>
      <p
        className={`mt-4 rounded-xl px-4 py-3 text-sm ${
          state.kind === 'error'
            ? 'bg-red-50 text-red-900'
            : state.kind === 'success'
              ? 'bg-emerald-50 text-emerald-900'
              : 'bg-background text-muted-foreground'
        }`}
        role={state.kind === 'error' ? 'alert' : 'status'}
      >
        {state.message}
      </p>
    </div>
  );
}
