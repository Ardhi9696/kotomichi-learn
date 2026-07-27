import { z } from 'zod';

export const REPORT_FIELDS = [
  'meaning',
  'reading',
  'example',
  'metadata',
  'other',
] as const;
export const REPORT_STATUSES = ['open', 'triaged', 'resolved', 'rejected'] as const;

export const reportFieldLabels: Record<(typeof REPORT_FIELDS)[number], string> = {
  meaning: 'Makna atau terjemahan',
  reading: 'Cara baca',
  example: 'Contoh kalimat',
  metadata: 'Metadata materi',
  other: 'Lainnya',
};

export const reportStatusLabels: Record<(typeof REPORT_STATUSES)[number], string> = {
  open: 'Terbuka',
  triaged: 'Ditinjau',
  resolved: 'Selesai',
  rejected: 'Ditolak',
};

export const createReportSchema = z.object({
  contentItemId: z.uuid(),
  locale: z.enum(['en', 'id', 'ko']),
  fieldName: z.enum(REPORT_FIELDS),
  message: z
    .string()
    .trim()
    .min(10, 'Jelaskan masalah dengan setidaknya 10 karakter.')
    .max(1000, 'Laporan maksimal 1.000 karakter.'),
});

export const updateReportSchema = z
  .object({
    reportId: z.uuid(),
    status: z.enum(REPORT_STATUSES),
    resolutionNotes: z.string().trim().max(1000, 'Catatan maksimal 1.000 karakter.'),
    currentFilter: z.enum([...REPORT_STATUSES, 'all']).default('open'),
  })
  .superRefine((value, context) => {
    if (
      (value.status === 'resolved' || value.status === 'rejected') &&
      value.resolutionNotes.length < 3
    ) {
      context.addIssue({
        code: 'custom',
        path: ['resolutionNotes'],
        message: 'Tambahkan catatan sebelum menutup laporan.',
      });
    }
  });
