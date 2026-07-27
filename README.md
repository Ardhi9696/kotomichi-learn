# Kotomichi Learn

Web belajar JLPT N5–N1 untuk vocabulary, kanji, dan grammar. Materi kanonis berasal
dari OpenJLPT dan disajikan melalui Supabase; dataset tidak disimpan di repository ini.

## Fitur saat ini

- Landing page dan katalog materi N5–N1 dengan tampilan grid/list serta pencarian
  judul, reading, makna Inggris, dan translation published.
- Filter kosakata N5/N4 berdasarkan kelas kata, kelompok verba
  godan/ichidan/tidak beraturan, transitivitas, jenis kata sifat い/な, dan
  sembilan tema praktis melalui kontrol di samping mode grid/list.
- Detail vocabulary, kanji, dan grammar dengan fallback bahasa Inggris.
- Supabase Auth: email/password, Google OAuth, verifikasi email, dan pemulihan password.
- Onboarding target JLPT, bahasa materi, dan target belajar harian.
- Dashboard progres dasar.
- Alur belajar terpadu: prompt depan, flip, pilihan ganda, feedback lengkap, lalu
  rating SRS yang langsung membuka kartu berikutnya; sesi review langsung membuka kuis.
- Pembuatan sesi belajar dapat membatasi vocabulary N5/N4 berdasarkan taxonomy
  yang sama dengan katalog.
- Navigasi akun responsif dengan sidebar desktop dan drawer mobile berbasis role.
- Workspace translation Indonesia/Korea dengan review dan audit revisi.
- Pengaturan profil, locale, target, tema, ekspor, dan penghapusan akun.
- Switcher tema Terang/Gelap/Sistem tersedia di header publik dan app shell,
  diterapkan sebelum paint serta mengikuti preferensi warna perangkat.
- Panel sinkronisasi snapshot OpenJLPT untuk superadmin.
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

Terapkan seluruh migration di `supabase/migrations` sebelum menjalankan versi
aplikasi terbaru.

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
Taxonomy kosakata N5/N4 diperkaya dari JMdict untuk metadata gramatikal dan aturan
tema Kotomichi yang deterministik. Hasil ambigu masuk antrean review editorial;
classifier dapat dijalankan ulang melalui
`node scripts/classify-vocabulary-n5-n4.mjs` setelah file sumber tersedia di `/tmp`.
Detail dimensi dan prosedur regenerasi tersedia di
[docs/vocabulary-taxonomy.md](./docs/vocabulary-taxonomy.md).

Lihat [NOTICE.md](./NOTICE.md) dan halaman `/attributions` untuk atribusi lengkap.

Panduan manifest, validasi, aktivasi, dan rollback tersedia di
[docs/source-sync.md](./docs/source-sync.md).
