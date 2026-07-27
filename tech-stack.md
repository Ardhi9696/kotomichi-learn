# Kotomichi Learn Web Tech Stack and Coding Rules

Dokumen ini menjadi acuan teknis untuk membangun Kotomichi Learn. Semua implementasi
baru harus mengikuti aturan di bawah agar aplikasi konsisten, aman, mudah diuji, dan tetap
kompatibel dengan dataset OpenJLPT.

## Stack

| Area | Teknologi | Aturan |
|---|---|---|
| Runtime | Node.js `>=20.9` | Gunakan versi LTS yang kompatibel dengan Next.js 16 |
| Package manager | npm | Pertahankan satu `package-lock.json`; jangan mencampur npm, pnpm, dan Yarn |
| Web framework | Next.js 16 App Router | Gunakan Server Components sebagai default |
| Language | TypeScript | `strict: true`; JavaScript hanya untuk file konfigurasi yang mewajibkannya |
| UI | React 19 + Tailwind CSS 4 | Gunakan design tokens dari [`design.md`](./design.md) |
| Validation | Zod | Validasi seluruh input dari form, URL, API, dan environment |
| Auth dan database | Supabase Auth + PostgreSQL | Seluruh tabel milik pengguna wajib memakai Row Level Security |
| Data JLPT | OpenJLPT → Supabase | OpenJLPT adalah SSOT; Supabase menyimpan serving copy |
| Unit/component test | Vitest + Testing Library | Uji perilaku, bukan detail implementasi |
| End-to-end test | Playwright | Uji alur pengguna yang kritis |
| Deployment | Vercel | Jalankan quality gate sebelum production deploy |

## Struktur aplikasi

Web ditempatkan di `apps/web/`. Materi tidak disimpan di repository dan dibaca dari
serving tables Supabase.

```text
apps/web/
├── app/              # route, layout, page, loading, error, dan route handler
├── components/       # komponen UI lintas fitur
├── features/         # logika dan UI berdasarkan domain
├── lib/              # query Supabase, validasi, domain logic, dan utilitas
└── tests/            # fixture dan test lintas fitur

supabase/
├── migrations/       # seluruh perubahan schema dan RLS PostgreSQL
└── seed/             # fixture lokal; bukan pengganti import OpenJLPT
```

Kode yang hanya dipakai satu fitur tetap berada di dalam folder fitur tersebut. Pindahkan
kode ke `components/` atau `lib/` hanya setelah benar-benar digunakan oleh lebih dari satu
fitur.

## Aturan TypeScript

- Pertahankan `strict: true`; dilarang menonaktifkan strict mode untuk menyelesaikan error.
- Dilarang menggunakan `any`. Gunakan tipe konkret, generic, atau `unknown` lalu lakukan
  narrowing.
- Gunakan `type` untuk union, mapped type, dan props; gunakan `interface` hanya untuk
  kontrak yang memang perlu declaration merging atau extension.
- Hindari type assertion (`as`) dan non-null assertion (`!`). Jika tidak terhindarkan,
  jelaskan invariant-nya dalam komentar singkat.
- Semua public function harus mempunyai return type yang jelas.
- Gunakan union `Level` dari domain aplikasi; jangan menulis ulang string level secara
  bebas.
- Simpan identifier, nama file, nama function, dan komentar kode dalam bahasa Inggris.
  Teks UI dapat memakai bahasa Indonesia melalui layer translation/content.
- Validasi data pada trust boundary dengan Zod; tipe statis tidak menggantikan validasi
  runtime.

## Aturan Next.js dan React

### Server dan client

- Semua page, layout, dan komponen adalah Server Components secara default.
- Tambahkan `"use client"` hanya pada komponen paling bawah yang membutuhkan state,
  event handler, effect, context client, atau browser API.
- Jangan mengirim object besar dari dataset ke Client Component. Pilih field yang
  diperlukan dan kirim props yang serializable.
- Akses filesystem, secret, dan Supabase server client hanya dari server.
- Web membaca materi dari serving tables Supabase. Sinkronisasi sumber berjalan sebagai
  job server terpisah dan tidak bergantung pada dataset yang tersimpan di repository.
- Gunakan Server Actions untuk mutasi yang berasal dari UI aplikasi.
- Gunakan Route Handlers untuk endpoint HTTP yang perlu dikonsumsi pihak lain, webhook,
  atau response non-UI.

### Komponen

- Gunakan function component dan named export, kecuali file convention Next.js yang
  memerlukan default export.
- Satu komponen harus memiliki satu tanggung jawab yang jelas.
- Jangan menyimpan derived state; hitung dari props atau state sumber.
- Hindari `useEffect` untuk data yang dapat diambil di server atau dihitung saat render.
- Gunakan semantic HTML terlebih dahulu; tambahkan ARIA hanya ketika elemen native tidak
  cukup.
- Semua kontrol keyboard harus memiliki focus state yang terlihat dan semua gambar
  informatif harus memiliki `alt`.

### Data dan caching

- Tentukan caching secara eksplisit untuk pembacaan data; jangan mengandalkan asumsi
  default.
- Dataset JLPT bersifat read-only dan dapat di-cache agresif.
- Progres, hasil kuis, dan session pengguna bersifat dinamis dan tidak boleh masuk cache
  publik.
- Setelah mutasi, invalidasi hanya data atau route yang terdampak.
- Jangan mengakses Supabase melalui Route Handler dari Server Component jika server dapat
  memanggil Supabase secara langsung.

## Aturan data OpenJLPT

- Dataset OpenJLPT tidak disimpan di repository aplikasi.
- Perubahan model serving dimulai dari migration Supabase, lalu adapter sinkronisasi,
  query, dan test diperbarui bersama.
- Import `vocab`, `kanji`, dan `grammar` ke Supabase sebagai serving copy. Field kanonis
  hanya boleh berubah melalui sinkronisasi satu arah dari OpenJLPT tervalidasi.
- Simpan translation pada `vocab_translations`, `kanji_translations`, dan
  `grammar_translations`; jangan menambahkan hasil translation ke sumber OpenJLPT.
- Data pengguna menyimpan reference key yang stabil, misalnya `vocab:N5:食べる`, bukan
  salinan seluruh entry.
- Semua query level harus memakai nilai `N5`, `N4`, `N3`, `N2`, atau `N1`.
- Pertahankan atribusi sumber dan lisensi CC BY-SA 4.0 pada halaman legal aplikasi.

## Aturan Supabase

- Gunakan `@supabase/ssr`: pisahkan browser client dan server client.
- Gunakan publishable key di client. Secret/service-role key hanya boleh berada di server
  dan tidak boleh memakai prefix `NEXT_PUBLIC_`.
- Jangan pernah mengirim secret, session token, atau data sensitif ke log maupun props
  Client Component.
- Seluruh tabel dengan `user_id` wajib mengaktifkan RLS dan memiliki policy untuk operasi
  `select`, `insert`, `update`, dan `delete` yang memang diizinkan.
- Otorisasi ditegakkan di database melalui RLS, bukan hanya dengan menyembunyikan UI.
- Seluruh perubahan database dibuat sebagai migration dalam repository; jangan bergantung
  pada perubahan manual di dashboard.
- Generate dan gunakan tipe `Database` dari schema Supabase pada semua client.
- Validasi user di server sebelum operasi sensitif. Jangan mempercayai user ID dari body
  request; ambil identity dari session terverifikasi.
- Mutation harus menangani error secara eksplisit dan hanya menampilkan pesan aman kepada
  pengguna.

## Aturan Tailwind dan design system

- Tailwind v4 memakai konfigurasi CSS-first dan semantic tokens yang bersumber dari
  [`design.md`](./design.md).
- Gunakan class semantic seperti `bg-primary`, `text-foreground`, dan `border-border`;
  jangan menyebarkan raw hex color di komponen.
- Gunakan responsive utilities secara mobile-first.
- Jangan membentuk class Tailwind dengan interpolasi seperti `bg-${color}-500`. Gunakan
  map berisi nama class lengkap agar terdeteksi saat build.
- Hindari arbitrary value jika token yang sesuai sudah tersedia.
- Ekstrak komponen ketika pola visual dan perilakunya berulang; jangan membuat komponen
  hanya untuk menyembunyikan satu rangkaian class.
- Light mode adalah default. Dark mode menggunakan token, bukan duplikasi style per
  komponen.
- Font dimuat melalui mekanisme font Next.js dan dipetakan ke CSS variables. Jangan
  menggunakan `@import` font eksternal yang render-blocking.

## Penamaan dan format kode

- Komponen React: `PascalCase.tsx`.
- Module, helper, hook, dan test: `kebab-case.ts` atau `kebab-case.tsx`.
- Function dan variable: `camelCase`; constant global: `UPPER_SNAKE_CASE`.
- Boolean diawali `is`, `has`, `can`, atau `should`.
- Event handler diawali `handle`; callback prop diawali `on`.
- Test ditempatkan dekat source sebagai `*.test.ts(x)`; E2E memakai `*.spec.ts`.
- Gunakan import alias untuk lintas domain dan relative import untuk file yang berdekatan.
- Formatter dan linter menjadi sumber kebenaran; jangan mengatur alignment manual.
- Komentar menjelaskan alasan atau constraint, bukan mengulang isi kode.

## Error handling dan observability

- Jangan memakai empty `catch`. Tangani, ubah menjadi domain error, atau lempar kembali.
- Bedakan validation error, authentication error, authorization error, not found, conflict,
  dan internal error.
- Pesan UI harus membantu pengguna tanpa mengekspos stack trace atau detail database.
- Log production berbentuk structured log dan menyertakan request/correlation ID.
- Dilarang mencatat password, token, cookie, email lengkap, jawaban pribadi, atau secret.
- Gunakan `error.tsx` untuk kegagalan route yang dapat dipulihkan dan `not-found.tsx` untuk
  resource yang tidak tersedia.

## Testing

- Unit test mencakup algoritma kuis, scoring, streak, spaced repetition, parsing reference
  key, dan mapping data OpenJLPT.
- Component test mencakup loading, empty, error, disabled, keyboard, serta state jawaban
  benar dan salah.
- Integration test memverifikasi migration, RLS, dan bahwa pengguna tidak dapat membaca
  atau mengubah progres pengguna lain.
- E2E minimal mencakup login, memilih level, menyelesaikan sesi belajar, mengerjakan kuis,
  menyimpan progres, logout, dan melanjutkan progres setelah login kembali.
- Test harus deterministik: waktu, random question, dan network response dikontrol melalui
  fixture atau dependency injection.
- Bug fix wajib menyertakan regression test.

## Quality gate

Sebelum merge atau deploy, seluruh pemeriksaan berikut wajib berhasil:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run validate
npm run build
```

Jika script web berada dalam npm workspace, command root harus meneruskan pemeriksaan ke
workspace tersebut. CI tidak boleh melewati typecheck, test, validasi dataset, atau build.

## Environment dan keamanan

- Sediakan `.env.example` yang hanya berisi nama variable dan nilai contoh aman.
- Validasi environment variable sekali saat startup; aplikasi harus gagal lebih awal jika
  konfigurasi wajib tidak tersedia.
- Hanya variable yang aman untuk browser boleh memakai prefix `NEXT_PUBLIC_`.
- Jangan commit `.env`, credential, token, dump database pengguna, atau artifact produksi.
- Semua dependency baru harus memiliki alasan penggunaan yang jelas dan lisensi yang
  kompatibel.
- Jangan memasukkan data dari sumber proprietary ke dataset tanpa izin redistribusi.
