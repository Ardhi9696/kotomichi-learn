import { requireUser } from '@/lib/auth/require-user';

export async function GET() {
  const { supabase, user } = await requireUser();
  const [profile, roles, progress, sessions, attempts, reports] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role,created_at').eq('user_id', user.id),
    supabase.from('learning_progress').select('*').eq('user_id', user.id),
    supabase.from('learning_sessions').select('*').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('*').eq('user_id', user.id),
    supabase.from('content_reports').select('*').eq('reporter_id', user.id),
  ]);

  const failed = [profile, roles, progress, sessions, attempts, reports].find(
    (result) => result.error,
  );
  if (failed?.error) {
    return Response.json(
      { error: 'Data akun belum dapat diekspor.' },
      { status: 500 },
    );
  }

  const payload = {
    format: 'kotomichi-account-export',
    version: 1,
    generated_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
    },
    profile: profile.data,
    roles: roles.data ?? [],
    learning_progress: progress.data ?? [],
    learning_sessions: sessions.data ?? [],
    quiz_attempts: attempts.data ?? [],
    content_reports: reports.data ?? [],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Disposition': 'attachment; filename="kotomichi-account-export.json"',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}
