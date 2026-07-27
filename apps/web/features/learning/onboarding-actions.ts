'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';

const onboardingSchema = z.object({
  target_level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']),
  content_locale: z.enum(['en', 'id', 'ko']),
  daily_goal: z.coerce.number().int().min(5).max(50),
});

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function completeOnboarding(formData: FormData): Promise<never> {
  const result = onboardingSchema.safeParse({
    target_level: formString(formData, 'target_level'),
    content_locale: formString(formData, 'content_locale'),
    daily_goal: formString(formData, 'daily_goal'),
  });

  if (!result.success) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? 'Periksa kembali pilihan onboarding.',
      )}`,
    );
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from('profiles')
    .update({
      target_level: result.data.target_level,
      content_locale: result.data.content_locale,
      interface_locale: result.data.content_locale,
      daily_goal: result.data.daily_goal,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    redirect(
      `/onboarding?error=${encodeURIComponent(
        'Pilihan belum dapat disimpan. Coba kembali.',
      )}`,
    );
  }

  redirect('/dashboard?message=Perjalanan+belajarmu+sudah+siap.');
}
