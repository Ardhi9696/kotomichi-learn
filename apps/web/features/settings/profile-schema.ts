import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60),
  avatar_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === '' || z.url().safeParse(value).success,
      'URL avatar tidak valid.',
    ),
  content_locale: z.enum(['en', 'id', 'ko']),
  interface_locale: z.enum(['en', 'id', 'ko']),
  target_level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']),
  daily_goal: z.coerce.number().int().min(1).max(200),
  theme: z.enum(['light', 'dark', 'system']),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('HAPUS', 'Ketik HAPUS untuk mengonfirmasi.'),
});
