import { z } from 'zod';

export const MANAGEABLE_ROLES = ['editor', 'reviewer', 'admin'] as const;

export const assignRoleSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Masukkan alamat email yang valid.')),
  role: z.enum(MANAGEABLE_ROLES),
});

export const removeRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(MANAGEABLE_ROLES),
});
