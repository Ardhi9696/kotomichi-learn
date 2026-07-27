import { expect, test } from '@playwright/test';

test('visitor can switch and persist light, dark, and system themes', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByLabel(/Tema:/).click();
  await page.getByRole('button', { name: 'Terang' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const lightAppearance = await page.evaluate(() => {
    function luminance(color: string) {
      const channels = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    }
    function ratio(foreground: string, background: string) {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    }

    const section = document.querySelector<HTMLElement>(
      '[data-section="learning-benefits"]',
    );
    const heading = section?.querySelector<HTMLElement>('h2');
    const badge = document.querySelector<HTMLElement>(
      '[data-testid="daily-step-badge"]',
    );
    if (!section || !heading || !badge) {
      return { sectionLuminance: 0, heading: 0, badge: 0 };
    }

    return {
      sectionLuminance: luminance(getComputedStyle(section).backgroundColor),
      heading: ratio(
        getComputedStyle(heading).color,
        getComputedStyle(section).backgroundColor,
      ),
      badge: ratio(
        getComputedStyle(badge).color,
        getComputedStyle(badge).backgroundColor,
      ),
    };
  });
  expect(lightAppearance.sectionLuminance).toBeGreaterThan(0.7);
  expect(lightAppearance.heading).toBeGreaterThanOrEqual(7);
  expect(lightAppearance.badge).toBeGreaterThanOrEqual(4.5);

  await page.getByLabel('Tema: Terang').click();
  await page.getByRole('button', { name: 'Gelap' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const contrast = await page
    .locator('[data-section="learning-benefits"]')
    .evaluate((section) => {
      function luminance(color: string) {
        const channels = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
        const linear = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      }
      function ratio(foreground: string, background: string) {
        const lighter = Math.max(luminance(foreground), luminance(background));
        const darker = Math.min(luminance(foreground), luminance(background));
        return (lighter + 0.05) / (darker + 0.05);
      }

      const heading = section.querySelector('h2');
      const card = section.querySelector('article');
      const body = card?.querySelector('p');
      if (!heading || !card || !body) return { heading: 0, body: 0 };
      return {
        heading: ratio(
          getComputedStyle(heading).color,
          getComputedStyle(section).backgroundColor,
        ),
        body: ratio(
          getComputedStyle(body).color,
          getComputedStyle(card).backgroundColor,
        ),
      };
    });
  expect(contrast.heading).toBeGreaterThanOrEqual(7);
  expect(contrast.body).toBeGreaterThanOrEqual(4.5);

  const primaryButtonContrast = await page
    .getByRole('link', { name: 'Mulai sekarang' })
    .evaluate((button) => {
      function luminance(color: string) {
        const channels = color.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
        const linear = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      }

      const style = getComputedStyle(button);
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05);
    });
  expect(primaryButtonContrast).toBeGreaterThanOrEqual(4.5);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByLabel('Tema: Gelap').click();
  await page.getByRole('button', { name: 'Sistem' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
});

test('semantic status surfaces use their dark palette', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('kotomichi-theme', 'dark');
  });

  await page.goto('/auth/login?error=Data%20belum%20dapat%20disimpan');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const error = page.getByText('Data belum dapat disimpan', { exact: true });
  await expect(error).toHaveCSS('background-color', 'rgb(53, 27, 26)');
  await expect(error).toHaveCSS('color', 'rgb(255, 170, 164)');
  await expect(error).toHaveCSS('border-color', 'rgb(111, 55, 50)');

  await page.goto('/auth/login?message=Data%20berhasil%20disimpan');
  const success = page.getByText('Data berhasil disimpan', { exact: true });
  await expect(success).toHaveCSS('background-color', 'rgb(20, 44, 32)');
  await expect(success).toHaveCSS('color', 'rgb(149, 219, 173)');
  await expect(success).toHaveCSS('border-color', 'rgb(49, 92, 65)');
});

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

  await page.getByText('Filter vocabulary').click();
  const taxonomyForm = page
    .locator('form')
    .filter({ has: page.locator('[name="pos"]') });
  await page.getByLabel('Kelas kata').selectOption('verb');
  await page.getByLabel('Kelompok verba').selectOption('ichidan');
  await taxonomyForm.locator('select[name="theme"]').selectOption('food_drink');
  await taxonomyForm
    .getByRole('button', { name: 'Terapkan' })
    .click();

  await expect(page).toHaveURL(/pos=verb/);
  await expect(page).toHaveURL(/verb=ichidan/);
  await expect(page).toHaveURL(/theme=food_drink/);
  const firstResult = page.locator('article').first();
  await expect(firstResult.getByText('Kata kerja')).toBeVisible();
  await expect(firstResult.getByText('Makanan & minuman')).toBeVisible();
});

test('vocabulary filters remain visible and contained on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/catalog?level=N5&type=vocabulary');

  const filterControl = page.getByText('Filter vocabulary', { exact: true });
  await expect(filterControl).toBeVisible();
  await filterControl.click();

  const filterForm = page
    .locator('form')
    .filter({ has: page.locator('[name="pos"]') });
  await expect(filterForm).toBeVisible();
  await expect(page.getByLabel('Kelas kata')).toBeVisible();
  await expect(filterForm.locator('select[name="theme"]')).toBeVisible();

  const box = await filterForm.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
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
