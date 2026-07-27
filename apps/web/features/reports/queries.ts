import { requireEditorial } from '@/lib/auth/require-editorial';
import type { Enums, Tables } from '@/lib/supabase/database.types';

export type ReportFilter = Enums<'report_status'> | 'all';

export type EditorialReport = Pick<
  Tables<'content_reports'>,
  | 'id'
  | 'locale'
  | 'field_name'
  | 'message'
  | 'status'
  | 'resolution_notes'
  | 'created_at'
> & {
  content_items: Pick<
    Tables<'content_items'>,
    'id' | 'content_type' | 'level' | 'word' | 'reading' | 'character' | 'pattern'
  >;
};

export async function getEditorialReports(status: ReportFilter) {
  const { supabase, canManageReports } = await requireEditorial();
  let query = supabase
    .from('content_reports')
    .select(
      'id,locale,field_name,message,status,resolution_notes,created_at,content_items!inner(id,content_type,level,word,reading,character,pattern)',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error('Antrean laporan belum dapat dimuat.');

  return {
    reports: (data ?? []) as EditorialReport[],
    canManageReports,
  };
}
