'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  createReportSchema,
  updateReportSchema,
} from '@/features/reports/report-schema';
import { requireEditorial } from '@/lib/auth/require-editorial';
import { requireUser } from '@/lib/auth/require-user';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function contentPath(
  contentItemId: string,
  locale: string,
  kind?: 'error' | 'message',
  message?: string,
): string {
  const params = new URLSearchParams({
    locale: ['en', 'id', 'ko'].includes(locale) ? locale : 'id',
  });
  if (kind && message) params.set(kind, message);
  return `/catalog/${encodeURIComponent(contentItemId)}?${params.toString()}#laporkan`;
}

export async function createContentReport(formData: FormData): Promise<never> {
  const result = createReportSchema.safeParse({
    contentItemId: formString(formData, 'content_item_id'),
    locale: formString(formData, 'locale'),
    fieldName: formString(formData, 'field_name'),
    message: formString(formData, 'message'),
  });
  if (!result.success) {
    const fallbackId = formString(formData, 'content_item_id');
    const fallbackLocale = formString(formData, 'locale');
    redirect(
      contentPath(
        fallbackId,
        fallbackLocale,
        'error',
        result.error.issues[0]?.message ?? 'Laporan tidak valid.',
      ),
    );
  }

  const { supabase, user } = await requireUser();
  const { data: contentItem, error: contentError } = await supabase
    .from('content_items')
    .select('id')
    .eq('id', result.data.contentItemId)
    .eq('is_active', true)
    .maybeSingle();
  if (contentError || !contentItem) {
    redirect(
      contentPath(
        result.data.contentItemId,
        result.data.locale,
        'error',
        'Materi tidak ditemukan.',
      ),
    );
  }

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    content_item_id: result.data.contentItemId,
    locale: result.data.locale,
    field_name: result.data.fieldName,
    message: result.data.message,
  });
  if (error) {
    const message =
      error.code === '23505'
        ? 'Laporan aktif untuk bagian ini sudah pernah dikirim.'
        : 'Laporan belum dapat dikirim.';
    redirect(
      contentPath(result.data.contentItemId, result.data.locale, 'error', message),
    );
  }

  revalidatePath('/reports');
  redirect(
    contentPath(
      result.data.contentItemId,
      result.data.locale,
      'message',
      'Terima kasih, laporanmu sudah dikirim.',
    ),
  );
}

export async function updateContentReport(formData: FormData): Promise<never> {
  const result = updateReportSchema.safeParse({
    reportId: formString(formData, 'report_id'),
    status: formString(formData, 'status'),
    resolutionNotes: formString(formData, 'resolution_notes'),
    currentFilter: formString(formData, 'current_filter') || 'open',
  });
  if (!result.success) {
    redirect(
      `/reports?status=${encodeURIComponent(
        formString(formData, 'current_filter') || 'open',
      )}&error=${encodeURIComponent(
        result.error.issues[0]?.message ?? 'Pembaruan laporan tidak valid.',
      )}`,
    );
  }

  const { supabase, user, canManageReports } = await requireEditorial();
  if (!canManageReports) {
    redirect(
      `/reports?status=${result.data.currentFilter}&error=${encodeURIComponent(
        'Role editor hanya dapat membaca laporan.',
      )}`,
    );
  }

  const isClosed = result.data.status === 'resolved' || result.data.status === 'rejected';
  const { data: updated, error } = await supabase
    .from('content_reports')
    .update({
      status: result.data.status,
      resolution_notes: result.data.resolutionNotes || null,
      resolved_by: isClosed ? user.id : null,
      resolved_at: isClosed ? new Date().toISOString() : null,
    })
    .eq('id', result.data.reportId)
    .select('id')
    .maybeSingle();

  if (error || !updated) {
    redirect(
      `/reports?status=${result.data.currentFilter}&error=${encodeURIComponent(
        'Laporan belum dapat diperbarui.',
      )}`,
    );
  }

  revalidatePath('/reports');
  revalidatePath('/admin');
  redirect(
    `/reports?status=${result.data.currentFilter}&message=${encodeURIComponent(
      'Status laporan berhasil diperbarui.',
    )}`,
  );
}
