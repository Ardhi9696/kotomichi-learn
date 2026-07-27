import { expect, test } from '@playwright/test';

test('learner can open the N5 catalog and a material detail', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Temukan jalanmu menuju bahasa Jepang/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Mulai dari N5' }).click();
  await expect(page).toHaveURL(/\/catalog\?level=N5&type=all/);
  await expect(page.getByText(/materi ditemukan/i)).toBeVisible();

  const firstDetailLink = page.getByRole('link', { name: /^Lihat detail / }).first();
  await expect(firstDetailLink).toBeVisible();
  await firstDetailLink.click();

  await expect(page.getByText('Makna', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Kembali ke N5/i })).toBeVisible();
});

test('attribution remains publicly reachable', async ({ page }) => {
  await page.goto('/attributions');

  await expect(page.getByRole('heading', { name: 'Atribusi & lisensi' })).toBeVisible();
  await expect(page.getByText('OpenJLPT', { exact: true })).toBeVisible();
  await expect(page.getByText(/bukan daftar resmi JLPT/i)).toBeVisible();
});

test('anonymous learner is redirected from dashboard to login', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lanjutkan dengan Google' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('registration and recovery pages are publicly reachable', async ({ page }) => {
  await page.goto('/auth/register');
  await expect(page.getByRole('heading', { name: 'Mulai membangun kebiasaan.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lanjutkan dengan Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buat akun' })).toBeVisible();

  await page.goto('/auth/forgot-password');
  await expect(page.getByRole('heading', { name: 'Temukan kembali jalanmu.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kirim tautan pemulihan' })).toBeVisible();
});
