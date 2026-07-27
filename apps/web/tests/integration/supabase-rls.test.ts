import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import type { Database } from '@/lib/supabase/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const firstEmail = process.env.INTEGRATION_USER_A_EMAIL;
const firstPassword = process.env.INTEGRATION_USER_A_PASSWORD;
const secondEmail = process.env.INTEGRATION_USER_B_EMAIL;
const secondPassword = process.env.INTEGRATION_USER_B_PASSWORD;

const hasIsolationCredentials = Boolean(
  url && key && firstEmail && firstPassword && secondEmail && secondPassword,
);

async function signedInClient(email: string, password: string) {
  const client = createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error ?? new Error('Authentication failed.');
  return { client, user: data.user };
}

describe.skipIf(!hasIsolationCredentials)('authenticated RLS integration', () => {
  it('isolates profile and progress rows between two users', async () => {
    const first = await signedInClient(firstEmail!, firstPassword!);
    const second = await signedInClient(secondEmail!, secondPassword!);

    const [profiles, progress] = await Promise.all([
      first.client.from('profiles').select('id').eq('id', second.user.id),
      first.client
        .from('learning_progress')
        .select('id')
        .eq('user_id', second.user.id),
    ]);

    expect(profiles.error).toBeNull();
    expect(profiles.data).toEqual([]);
    expect(progress.error).toBeNull();
    expect(progress.data).toEqual([]);
  });
});

const roleCases = [
  ['editor', 'INTEGRATION_EDITOR_EMAIL', 'INTEGRATION_EDITOR_PASSWORD'],
  ['reviewer', 'INTEGRATION_REVIEWER_EMAIL', 'INTEGRATION_REVIEWER_PASSWORD'],
  ['admin', 'INTEGRATION_ADMIN_EMAIL', 'INTEGRATION_ADMIN_PASSWORD'],
] as const;

for (const [role, emailKey, passwordKey] of roleCases) {
  const email = process.env[emailKey];
  const password = process.env[passwordKey];

  describe.skipIf(!url || !key || !email || !password)(`${role} role integration`, () => {
    it(`exposes the assigned ${role} role to its owner`, async () => {
      const session = await signedInClient(email!, password!);
      const { data, error } = await session.client
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      expect(error).toBeNull();
      expect(data?.map((row) => row.role)).toContain(role);
    });
  });
}

