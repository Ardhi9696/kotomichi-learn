import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login?next=/dashboard');
  await page.getByLabel('Email').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
}

const learnerEmail = process.env.E2E_USER_EMAIL;
const learnerPassword = process.env.E2E_USER_PASSWORD;

test.describe('authenticated learner workflow', () => {
  test.skip(
    !learnerEmail || !learnerPassword,
    'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run authenticated E2E.',
  );

  test('login, learning entry, review, settings, export, and dashboard are connected', async ({
    page,
  }) => {
    await login(page, learnerEmail!, learnerPassword!);
    test.skip(
      new URL(page.url()).pathname === '/onboarding',
      'The E2E learner account must have completed onboarding.',
    );

    await expect(page.getByRole('heading', { name: /Halo,/ })).toBeVisible();
    await page.goto('/learn');
    await expect(
      page.getByRole('heading', { name: /Pilih langkah kecil untuk hari ini/ }),
    ).toBeVisible();

    await page.goto('/review');
    await expect(
      page.getByRole('heading', { name: /Ingat kembali sebelum terlupa/ }),
    ).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Pengaturan akun' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Unduh data akun' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Unduh data akun' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('kotomichi-account-export.json');

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Halo,/ })).toBeVisible();
  });

  test('new learning session flips, quizzes, rates, and opens the next card', async ({
    page,
  }) => {
    await login(page, learnerEmail!, learnerPassword!);
    test.skip(
      new URL(page.url()).pathname === '/onboarding',
      'The E2E learner account must have completed onboarding.',
    );

    await page.goto('/learn');
    await page.locator('input[name="item_count"][value="5"]').check({ force: true });
    await page.getByRole('button', { name: 'Mulai sesi belajar' }).click();
    await expect(page).toHaveURL(/\/learn\/[0-9a-f-]+$/);

    await expect(
      page.getByRole('button', { name: 'Balik kartu · Mulai kuis' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Balik kartu · Mulai kuis' }).click();
    const firstChoice = page.locator('input[name="answer"]').first();
    await expect(firstChoice).toBeFocused();
    await firstChoice.check();
    await page.getByRole('button', { name: 'Periksa jawaban' }).click();
    await expect(page.getByText(/Jawaban (benar|belum tepat)/)).toBeVisible();

    const goodRating = page.getByRole('button', { name: /Bagus/ });
    if (await goodRating.isEnabled()) {
      await goodRating.click();
    } else {
      await page.getByRole('button', { name: /Sulit/ }).click();
    }
    await expect(
      page.getByRole('button', { name: 'Balik kartu · Mulai kuis' }),
    ).toBeVisible();
  });

  test('review sessions open directly on multiple choice', async ({ page }) => {
    await login(page, learnerEmail!, learnerPassword!);
    test.skip(
      new URL(page.url()).pathname === '/onboarding',
      'The E2E learner account must have completed onboarding.',
    );

    await page.goto('/review');
    test.skip(
      (await page.getByRole('button', { name: 'Mulai review' }).count()) === 0,
      'The E2E learner account has no due review items.',
    );
    await page.getByRole('button', { name: 'Mulai review' }).click();
    await expect(page).toHaveURL(/\/learn\/[0-9a-f-]+$/);
    await expect(
      page.getByRole('button', { name: 'Balik kartu · Mulai kuis' }),
    ).toHaveCount(0);
    await expect(page.locator('input[name="answer"]').first()).toBeFocused();
  });
});

const editorialAccounts = [
  {
    role: 'editor',
    email: process.env.E2E_EDITOR_EMAIL,
    password: process.env.E2E_EDITOR_PASSWORD,
  },
  {
    role: 'reviewer',
    email: process.env.E2E_REVIEWER_EMAIL,
    password: process.env.E2E_REVIEWER_PASSWORD,
  },
  {
    role: 'admin',
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
  },
] as const;

for (const account of editorialAccounts) {
  test(`${account.role} can access editorial and translation workspaces`, async ({
    page,
  }) => {
    test.skip(
      !account.email || !account.password,
      `Set E2E_${account.role.toUpperCase()}_EMAIL and password to run this role test.`,
    );
    await login(page, account.email!, account.password!);
    await page.goto('/editor');
    await expect(page).not.toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /materi/i })).toBeVisible();
    await page.goto('/translations');
    await expect(page.getByRole('heading', { name: /translation/i })).toBeVisible();
  });
}

test('superadmin can access source synchronization', async ({ page }) => {
  const email = process.env.E2E_SUPERADMIN_EMAIL;
  const password = process.env.E2E_SUPERADMIN_PASSWORD;
  test.skip(
    !email || !password,
    'Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD to run this test.',
  );

  await login(page, email!, password!);
  await page.goto('/admin/sources');
  await expect(page.getByRole('heading', { name: 'Sinkronisasi sumber' })).toBeVisible();
});
