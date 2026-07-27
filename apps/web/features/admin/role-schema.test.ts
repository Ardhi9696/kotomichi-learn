import { describe, expect, it } from 'vitest';

import { assignRoleSchema, removeRoleSchema } from '@/features/admin/role-schema';

describe('admin role schemas', () => {
  it('normalizes a valid email and accepts manageable roles', () => {
    expect(
      assignRoleSchema.parse({ email: ' Admin@Example.com ', role: 'reviewer' }),
    ).toEqual({ email: 'admin@example.com', role: 'reviewer' });
  });

  it('rejects superadmin role management', () => {
    expect(
      assignRoleSchema.safeParse({ email: 'admin@example.com', role: 'superadmin' })
        .success,
    ).toBe(false);
    expect(
      removeRoleSchema.safeParse({
        userId: '3d4cb4e8-cf13-49c4-aa9f-a3b55bd52f41',
        role: 'superadmin',
      }).success,
    ).toBe(false);
  });
});
