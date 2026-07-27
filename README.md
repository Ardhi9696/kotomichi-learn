# Kotomichi Learn

Web belajar JLPT N5–N1 untuk vocabulary, kanji, dan grammar. Materi kanonis berasal
dari OpenJLPT dan disajikan melalui Supabase; dataset tidak disimpan di repository ini.

## Fitur saat ini

- Landing page dan katalog materi N5–N1.
- Detail vocabulary, kanji, dan grammar dengan fallback bahasa Inggris.
- Supabase Auth: email/password, Google OAuth, verifikasi email, dan pemulihan password.
- Onboarding target JLPT, bahasa materi, dan target belajar harian.
- Dashboard progres dasar.
- Atribusi dan informasi lisensi sumber materi.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth dan PostgreSQL
- Vitest dan Playwright

## Menjalankan aplikasi

Persyaratan: Node.js 20 atau lebih baru dan npm.

```bash
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Isi `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Quality gate

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Struktur

```text
apps/web/            aplikasi Next.js
supabase/migrations/ schema, RLS, dan fungsi PostgreSQL
design.md            design system
prd.md               product requirements
tech-stack.md        stack dan aturan coding
NOTICE.md            sumber data dan atribusi
```

## Data dan lisensi

OpenJLPT tetap menjadi sumber kanonis materi. Supabase menyimpan serving copy yang
diimpor satu arah. Terjemahan Indonesia dan Korea disimpan sebagai overlay terpisah.

Lihat [NOTICE.md](./NOTICE.md) dan halaman `/attributions` untuk atribusi lengkap.
