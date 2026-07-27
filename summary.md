# Ringkasan Implementasi Kotomichi Learn

Terakhir diperbarui: 27 Juli 2026.

## Status singkat

Kotomichi Learn telah memiliki alur utama v1 dari katalog, akun, belajar, kuis,
spaced repetition, dashboard, workflow editorial, translation, pengaturan akun,
hingga sinkronisasi sumber manual. Seluruh migration Supabase production telah
diterapkan, termasuk `20260727080000_add_quiz_attempt_answer_text.sql` dan
`20260727081000_add_catalog_translation_search.sql`. Taxonomy vocabulary N5/N4,
seed klasifikasi, dan index reviewer juga telah diterapkan; migration terakhir
tercatat di remote sebagai `20260727114014_add_filtered_learning_candidates`.

## Fitur yang sudah diterapkan

### Website publik dan katalog

- Landing page, atribusi, katalog dengan mode grid/list, pagination, pencarian,
  dan detail materi.
- Vocabulary, kanji, dan grammar JLPT N5–N1.
- Metadata reading, examples, onyomi, kunyomi, strokes, grade, frequency,
  formation, tags, dan notes.
- Locale materi Inggris, Indonesia, dan Korea dengan fallback ke Inggris.
- Pencarian katalog mencakup judul, reading, makna kanonis, editorial override,
  serta translation Indonesia/Korea berstatus `published`.
- Translation published digunakan pada katalog dan detail.
- Seluruh 1.294 vocabulary N5/N4 memiliki taxonomy multidimensi: kelas kata,
  kelompok verba, transitivitas, jenis kata sifat, dan sembilan tema ringkas.
- Katalog vocabulary dapat difilter melalui taxonomy; badge ringkas muncul pada
  kartu dan metadata lengkap muncul pada detail. Kontrol filter ditempatkan di
  samping toggle grid/list.
- Klasifikasi gramatikal berasal dari JMdict, tema dari aturan Kotomichi yang
  deterministik, dengan provenance, confidence, dan antrean review.

### Authentication, onboarding, dan akun

- Registrasi/login email-password, Google OAuth, verifikasi email, lupa password,
  update password, dan logout.
- Route protection melalui proxy Next.js.
- Onboarding target JLPT, bahasa materi, dan target harian.
- Halaman `/settings` untuk nama, URL avatar, locale materi, locale antarmuka,
  target JLPT, target harian, serta tema light/dark/system.
- Tema tersimpan diterapkan pada layout aplikasi.
- Ekspor data akun sebagai JSON, meliputi profil, role, progres, sesi, attempt,
  dan laporan.
- Penghapusan akun mandiri dengan konfirmasi eksplisit. Penghapusan `auth.users`
  menghapus data pengguna terkait melalui foreign-key cascade.

### Belajar, kuis, dan spaced repetition

- Pembuatan dan kelanjutan sesi berdasarkan level, jenis materi, dan jumlah item.
- Jenis materi Vocabulary memiliki pilihan subkategori N5/N4; kandidat sesi
  difilter di database dan klasifikasi `needs_review` tidak digunakan ketika
  filter taxonomy aktif.
- Sesi baru memakai alur prompt depan → flip → pilihan ganda → feedback lengkap →
  rating yang langsung membuka kartu berikutnya.
- Sesi review langsung membuka pilihan ganda tanpa sisi depan.
- Vocabulary dan kanji bergantian menanyakan reading/makna; grammar selalu makna.
  Pertanyaan baru tidak lagi menghasilkan `recall`, tetapi histori lama tetap terbaca.
- Jawaban pilihan pengguna, normalisasi jawaban, response time sejak kuis terlihat,
  dan attempt idempoten tersimpan.
- Feedback menampilkan jawaban pengguna, jawaban benar, seluruh makna, reading,
  formation, contoh pertama, dan status fallback locale.
- Rating `forgot`, `hard`, `good`, dan `easy`.
- Jawaban salah hanya mengaktifkan `forgot` dan `hard`, dengan validasi yang sama
  pada server.
- Status `new`, `learning`, `review`, dan `mastered`.
- Update interval, ease factor, dan next review secara atomik.
- Review queue dan sesi review terpisah.

### Dashboard dan statistik

- App shell dengan sidebar desktop, drawer mobile, active state, dan menu berbasis
  role untuk learner, editorial, serta superadmin.
- Navigasi publik disederhanakan menjadi materi, mulai belajar, sumber, dan CTA akun.
- Target dan progres harian, due review, materi dipelajari/dikuasai, completion,
  akurasi, current/longest streak, aktivitas tujuh hari, breakdown jenis materi,
  dan riwayat sesi.
- Agregasi aktivitas melalui RPC database.

### Laporan materi

- Pengguna login dapat melaporkan field materi yang bermasalah.
- Pencegahan laporan aktif duplikat.
- Workspace `/reports` dengan filter status.
- Workflow `open`, `triaged`, `resolved`, dan `rejected`.
- Editor dapat membaca; reviewer/admin/superadmin dapat melakukan triase.

### Role, superadmin, dan CRUD editorial

- Role `editor`, `reviewer`, `admin`, dan `superadmin`.
- Superadmin mewarisi seluruh izin editorial.
- Panel `/admin` untuk statistik dan pengelolaan role.
- Workspace `/editor` untuk membuat, membaca, mengedit, mengarsipkan, dan
  memulihkan semua jenis materi.
- Edit materi OpenJLPT disimpan sebagai editorial override; serving copy sumber
  tetap utuh.
- Editor dapat mengoreksi taxonomy vocabulary tanpa mengubah serving copy
  OpenJLPT; koreksi editorial tidak ditimpa ketika seed dijalankan ulang.
- Soft-delete menjaga progres, attempt, dan laporan.

### Translation Indonesia dan Korea

- Workspace `/translations` dengan filter locale, level, jenis, status, dan
  pencarian.
- Coverage translation per jenis materi.
- Form vocabulary, kanji, dan grammar berdampingan dengan sumber Inggris.
- Save draft dan submit for review.
- Reviewer/admin/superadmin dapat mengubah status ke `draft`, `reviewed`,
  `published`, atau `needs_review` serta menyimpan catatan.
- Editor hanya dapat mengubah draft/needs-review miliknya; pembatasan diterapkan
  melalui RLS.
- Audit revision otomatis untuk setiap insert/update translation.
- Perubahan fingerprint sumber otomatis menandai translation lama
  `needs_review`.

### Sinkronisasi OpenJLPT

- Panel superadmin `/admin/sources`.
- Import manifest JSON tervalidasi di browser dan server.
- Upload bertahap 250 item agar dataset besar tidak bergantung pada satu request.
- Import dapat dilanjutkan secara idempoten setelah koneksi terputus.
- Fingerprint SHA-256 item dihitung di PostgreSQL.
- Validasi wajib vocabulary, kanji, dan grammar.
- Diff `added`, `changed`, `moved_level`, `removed`, dan `unchanged`.
- Aktivasi snapshot atomik.
- Rollback dengan mengaktifkan kembali snapshot archived.
- Materi yang hilang dinonaktifkan, bukan dihapus, sehingga progres tetap utuh.
- Panduan format dan operasi tersedia di `docs/source-sync.md`.

### Database dan keamanan

- Migration PostgreSQL tersimpan di repository dan sudah diterapkan ke Supabase.
- RLS pada profil, progres, sesi, attempt, laporan, translation, role, dan data
  editorial.
- Check constraint, foreign key, serta index untuk relasi dan query utama.
- Mutasi sensitif memverifikasi identitas dan role di database.
- Tidak ada service-role key di browser.

## Quality assurance

Hasil pemeriksaan terakhir:

- ESLint lulus tanpa warning.
- TypeScript strict type-check lulus.
- 60 unit/component/schema test lulus.
- 4 integration test berbasis credential tersedia dan otomatis skip jika akun
  fixture belum dikonfigurasi.
- 12 Playwright E2E publik lulus, termasuk filter taxonomy N5.
- 7 authenticated/role E2E tersedia dan otomatis skip jika password akun fixture
  belum dikonfigurasi.
- Production build Next.js lulus untuk 25 route.
- `git diff --check` lulus.
- Uji transaksi Supabase lulus untuk:
  - seed taxonomy tepat 662 vocabulary N5 dan 632 vocabulary N4;
  - filter kelas kata, kelompok verba, transitivitas, jenis adjektiva, dan tema;
  - kandidat sesi belajar terautentikasi mematuhi taxonomy dan mengecualikan
    klasifikasi yang masih perlu review;
  - RPC pencarian katalog menemukan translation `published`, mengabaikan draft,
    menjaga filter/pagination, dan me-rollback seluruh fixture;
  - migration nullable `quiz_attempts.answer_text`, validasi blank/maksimal 500
    karakter, kompatibilitas attempt lama, dan rollback tanpa perubahan persisten;
  - workflow translation dan audit revision;
  - import, validasi, dan diff snapshot;
  - aktivasi dan rollback snapshot;
  - isolasi profil/progres melalui RLS.
- Seluruh data uji database di-rollback.

## Fitur yang masih sebagian

### Authenticated E2E

Test login dan role sudah tersedia, tetapi eksekusi penuh membutuhkan akun fixture
beserta password melalui environment variable. Saat ini verifikasi authenticated
yang benar-benar dijalankan menggunakan transaksi PostgreSQL sebagai superadmin dan
uji isolasi RLS. Password akun pengguna tidak diubah untuk memaksa test E2E.

### Sinkronisasi sumber otomatis

Import manual, validasi, diff, aktivasi, dan rollback sudah tersedia. Yang belum:

- Download release/commit OpenJLPT secara otomatis.
- Adapter langsung dari format upstream ke manifest Kotomichi.
- Jadwal sinkronisasi berkala.
- Tampilan konflik per item.
- Rekonsiliasi identitas ambigu di luar deteksi moved-level.

### Settings lanjutan

Profil inti, tema, ekspor, dan penghapusan akun sudah selesai. Reminder, zona waktu,
dan pengaturan privasi granular belum tersedia.

### Pencarian dan learning path

- Pencarian substring sudah mencakup judul, reading, makna, serta translation
  published; belum memiliki relevance ranking atau filter status progres pengguna.
- Belum ada halaman learning path terpadu per level.
- Sesi materi baru dan review masih dimulai dari alur terpisah.

## Fitur yang belum diterapkan

- Guest learning dan merge progres guest.
- Daily session otomatis yang mencampur materi baru dengan due review.
- Progress page bulanan, waktu belajar, materi tersulit, dan tren jangka panjang.
- Privacy policy, terms of service, dan about.
- Email/browser reminder.
- Structured production logging, error tracking, metrics, alerting, dan rate limit.
- GitHub Actions, preview/production deployment, backup, dan disaster recovery.
- Audit revision untuk editorial override materi (audit translation sudah tersedia).
- PWA dan offline review.

## Rekomendasi berikutnya

### Prioritas 2 — Kualitas belajar

1. Daily session otomatis yang memprioritaskan overdue dan item sering salah.
2. Progress page dengan kalender, waktu belajar, dan materi tersulit.
3. Full-text search terindeks dengan relevance ranking dan highlighting.
4. Learning path per level.
5. Audit dan rollback revisi editorial.

### Prioritas 3 — Reliability dan pertumbuhan

1. CI/CD dan fixture database lokal deterministik.
2. Error tracking, structured logs, metrics, dan alert.
3. Sinkronisasi OpenJLPT terjadwal dengan adapter upstream.
4. Reminder review.
5. Guest mode, lalu PWA/offline.

## Risiko dan catatan

- Leaked-password protection Supabase masih perlu diaktifkan dari dashboard Auth.
- Advisor menandai beberapa RPC `security definer` sebagai callable oleh
  `authenticated`. Ini disengaja untuk operasi self-service dan superadmin; setiap
  fungsi memakai `search_path` kosong serta memverifikasi `auth.uid()`/role di
  database.
- Index lama yang belum digunakan masih muncul sebagai informasi advisor karena
  traffic database masih rendah.
- Implementasi saat ini masih berada di working tree lokal dan belum di-commit
  atau push.
