import { expect, test } from '@playwright/test';

test('learner can open the N5 catalog and a material detail', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Materi', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mulai sekarang' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Temukan jalanmu menuju bahasa Jepang/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Mulai dari N5' }).click();
  await expect(page).toHaveURL(/\/catalog\?level=N5&type=all/);
  await expect(page.getByText(/materi ditemukan/i)).toBeVisible();
  await page.getByRole('link', { name: 'Tampilan list' }).click();
  await expect(page).toHaveURL(/view=list/);
  await expect(page.getByRole('link', { name: 'Tampilan list' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  const firstDetailLink = page.getByRole('link', { name: /^Lihat detail / }).first();
  await expect(firstDetailLink).toBeVisible();
  await firstDetailLink.click();

  await expect(page.getByText('Makna', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Kembali ke N5/i })).toBeVisible();
});

test('learner can filter N5 vocabulary by grammatical taxonomy and theme', async ({
  page,
}) => {
  await page.goto('/catalog?level=N5&type=vocabulary');

  await page.getByLabel('Kelas kata').selectOption('verb');
  await page.getByLabel('Kelompok verba').selectOption('ichidan');
  await page.getByLabel('Tema').selectOption('food_drink');
  await page.getByRole('button', { name: 'Terapkan' }).click();

  await expect(page).toHaveURL(/pos=verb/);
  await expect(page).toHaveURL(/verb=ichidan/);
  await expect(page).toHaveURL(/theme=food_drink/);
  const firstResult = page.locator('article').first();
  await expect(firstResult.getByText('Kata kerja')).toBeVisible();
  await expect(firstResult.getByText('Makanan & minuman')).toBeVisible();
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

test('anonymous learner is redirected from learning sessions to login', async ({ page }) => {
  await page.goto('/learn');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Flearn/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
});

test('anonymous learner is redirected from review queue to login', async ({ page }) => {
  await page.goto('/review');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Freview/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
});

test('anonymous visitor is redirected from superadmin to login', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fadmin/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
});

test('anonymous visitor is redirected from editorial reports to login', async ({ page }) => {
  await page.goto('/reports');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Freports/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
});

test('anonymous visitor is redirected from material editor to login', async ({ page }) => {
  await page.goto('/editor');

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Feditor/);
  await expect(page.getByRole('heading', { name: 'Masuk ke perjalananmu.' })).toBeVisible();
});

test('anonymous visitor is redirected from translation workspace to login', async ({ page }) => {
  await page.goto('/translations');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Ftranslations/);
});

test('anonymous visitor is redirected from account settings to login', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fsettings/);
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
