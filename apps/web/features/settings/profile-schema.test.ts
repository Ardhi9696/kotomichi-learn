import { describe, expect, it } from 'vitest';

import { deleteAccountSchema, profileSchema } from './profile-schema';

const validProfile = {
  display_name: 'Kotomichi Learner',
  avatar_url: 'https://example.com/avatar.png',
  content_locale: 'id',
  interface_locale: 'id',
  target_level: 'N3',
  daily_goal: '20',
  theme: 'system',
};

describe('profileSchema', () => {
  it('accepts a complete profile and coerces the daily goal', () => {
    expect(profileSchema.parse(validProfile).daily_goal).toBe(20);
  });

  it('allows an empty avatar URL', () => {
    expect(profileSchema.safeParse({ ...validProfile, avatar_url: '' }).success).toBe(
      true,
    );
  });

  it('rejects unsafe profile values', () => {
    expect(
      profileSchema.safeParse({
        ...validProfile,
        display_name: 'A',
        daily_goal: '999',
      }).success,
    ).toBe(false);
  });
});

describe('deleteAccountSchema', () => {
  it('requires the exact confirmation phrase', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'hapus' }).success).toBe(
      false,
    );
    expect(deleteAccountSchema.safeParse({ confirmation: 'HAPUS' }).success).toBe(
      true,
    );
  });
});
