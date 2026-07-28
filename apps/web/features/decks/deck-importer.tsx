'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  calculateDeckDiff,
  parseDeckTsv,
  sha256Hex,
  type DeckDiff,
  type DeckImportRow,
  type DeckTsvIssue,
} from '@/features/decks/deck-tsv';
import type { Json } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/browser';

type ImportDeck = {
  id: string;
  title: string;
  visibility: 'private' | 'public';
  review_status: 'draft' | 'pending' | 'approved' | 'rejected';
};

export function DeckImporter({
  deck,
  currentRows,
  userId,
}: {
  deck: ImportDeck;
  currentRows: DeckImportRow[];
  userId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<DeckImportRow[]>([]);
  const [issues, setIssues] = useState<DeckTsvIssue[]>([]);
  const [diff, setDiff] = useState<DeckDiff | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function preview(selectedFile: File | null) {
    setFile(selectedFile);
    setMessage('');
    setRows([]);
    setDiff(null);
    if (!selectedFile) return;

    setBusy(true);
    try {
      const result = await parseDeckTsv(selectedFile);
      setRows(result.rows);
      setIssues(result.issues);
      if (result.canImport) setDiff(calculateDeckDiff(currentRows, result.rows));
    } catch {
      setIssues([{
        row: 0,
        severity: 'error',
        message: 'File TSV tidak dapat dibaca.',
      }]);
    } finally {
      setBusy(false);
    }
  }

  async function applyImport() {
    if (!file || !diff || issues.some((entry) => entry.severity === 'error')) return;
    if (
      diff.removed > 0
      && !window.confirm(
        `${diff.removed} baris yang hilang akan diarsipkan. Progres belajar tetap disimpan. Lanjutkan?`,
      )
    ) return;

    setBusy(true);
    setMessage('');
    const supabase = createClient();
    try {
      const checksum = await sha256Hex(file);
      const isPublicUpdate = deck.visibility === 'public' && deck.review_status === 'approved';
      const { data: imported, error: importError } = await supabase
        .from('deck_imports')
        .insert({
          deck_id: deck.id,
          imported_by: userId,
          checksum,
          normalized_payload: rows as unknown as Json,
          diff: diff as unknown as Json,
          row_errors: issues
            .filter((entry) => entry.severity === 'error') as unknown as Json,
          row_warnings: issues
            .filter((entry) => entry.severity === 'warning') as unknown as Json,
          status: isPublicUpdate ? 'pending' : 'preview',
        })
        .select('id')
        .single();

      if (importError) {
        setMessage(
          importError.code === '23505'
            ? 'File yang sama sudah pernah diimpor ke deck ini.'
            : `Impor belum dapat disimpan: ${importError.message}`,
        );
        return;
      }

      if (isPublicUpdate) {
        setMessage('Versi baru masuk antrean review. Versi publik lama tetap aktif.');
      } else {
        const { error: applyError } = await supabase.rpc('apply_deck_import', {
          p_import_id: imported.id,
        });
        if (applyError) {
          setMessage(`Versi tersimpan tetapi belum dapat diterapkan: ${applyError.message}`);
          return;
        }
        setMessage('Versi deck berhasil diterapkan.');
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <label className="grid gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 p-6 font-semibold">
        Master TSV v1
        <input
          accept=".tsv,text/tab-separated-values,text/plain"
          className="block w-full text-sm font-normal"
          disabled={busy}
          onChange={(event) => void preview(event.target.files?.[0] ?? null)}
          type="file"
        />
        <span className="text-xs font-normal text-muted-foreground">
          Maksimum 5 MiB dan 10.000 baris. Parsing berlangsung di worker browser.
        </span>
      </label>

      {busy ? <p className="text-sm text-muted-foreground">Memproses TSV…</p> : null}
      {message ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      {diff ? (
        <section>
          <h2 className="font-serif text-2xl font-bold">Preview perubahan</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(diff).map(([label, count]) => (
              <div className="rounded-xl border border-border bg-surface p-4" key={label}>
                <dt className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl font-bold">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {issues.length ? (
        <section>
          <h2 className="font-serif text-2xl font-bold">Laporan baris</h2>
          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-border bg-surface">
            {issues.map((entry, index) => (
              <p
                className={`border-b border-border px-4 py-3 text-sm last:border-0 ${
                  entry.severity === 'error' ? 'text-danger-foreground' : 'text-amber-700'
                }`}
                key={`${entry.row}:${entry.field ?? ''}:${index}`}
              >
                Baris {entry.row || 'file'}
                {entry.field ? ` · ${entry.field}` : ''}: {entry.message}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {diff ? (
        <button
          className="mx-auto w-full max-w-sm rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          disabled={busy}
          onClick={() => void applyImport()}
          type="button"
        >
          {deck.visibility === 'public' ? 'Kirim versi untuk review' : 'Terapkan versi privat'}
        </button>
      ) : null}
    </div>
  );
}
