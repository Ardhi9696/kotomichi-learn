# Product Requirements Document — Kotomichi Learn

| Metadata | Nilai |
|---|---|
| Status | Draft v1.0 |
| Produk | Web belajar JLPT N5–N1 |
| Nama produk | Kotomichi Learn |
| Platform awal | Responsive web |
| Sumber materi | OpenJLPT |
| Bahasa sumber | Inggris (`en`) |
| Bahasa tambahan | Indonesia (`id`) dan Korea (`ko`) |

## 1. Ringkasan

Kotomichi Learn adalah web untuk mempelajari kosakata, kanji, dan grammar JLPT dari N5
hingga N1. Materi kanonis selalu berasal dari OpenJLPT. Aplikasi menambahkan pengalaman
belajar, akun, progres, kuis, spaced repetition, serta terjemahan Indonesia dan Korea
tanpa mengubah atau menggantikan materi sumber.

OpenJLPT menjadi **single source of truth (SSOT)** untuk:

- Penempatan level N5–N1.
- Kata, reading, kanji, pola grammar, dan contoh bahasa Jepang.
- Makna, penjelasan, serta contoh terjemahan bahasa Inggris.
- Metadata kanji seperti onyomi, kunyomi, jumlah coretan, grade, dan frekuensi.

Terjemahan Indonesia dan Korea disimpan sebagai overlay terpisah. Jika terjemahan belum
tersedia atau sedang ditinjau, aplikasi menampilkan konten Inggris dari OpenJLPT sebagai
fallback dan memberi label bahwa konten tersebut adalah sumber Inggris.

## 2. Tujuan dan indikator keberhasilan

### Tujuan produk

1. Menyediakan jalur belajar terstruktur untuk seluruh level JLPT N5–N1.
2. Membantu pengguna mengingat materi melalui sesi harian, kuis, dan review terjadwal.
3. Menyediakan materi dalam Inggris, Indonesia, dan Korea tanpa membuat fork data
   OpenJLPT.
4. Menjaga atribusi, ShareAlike, dan kesegaran data sesuai lisensi OpenJLPT.
5. Membuat progres pengguna dapat dilanjutkan lintas perangkat melalui akun.

### Indikator keberhasilan

| Indikator | Target awal |
|---|---|
| Activation | Pengguna menyelesaikan satu sesi belajar dalam 24 jam setelah mendaftar |
| Completion | Minimal 60% sesi yang dimulai diselesaikan |
| Retention | Minimal 25% pengguna aktif kembali pada hari ke-7 |
| Learning habit | Minimal 3 hari belajar aktif per minggu untuk pengguna retained |
| Reliability | Tidak ada kehilangan progres pada alur normal maupun retry |
| Localization | Coverage dan status review dapat dilihat per bahasa, tipe materi, dan level |
| License compliance | Halaman atribusi selalu dapat diakses dari footer publik |

Target angka merupakan baseline produk dan dapat disesuaikan setelah tersedia data beta.

## 3. Pengguna

### Learner

- Pemula yang menargetkan N5 atau N4.
- Pelajar menengah dan lanjutan yang menargetkan N3, N2, atau N1.
- Pengguna berbahasa Indonesia, Korea, atau Inggris.
- Membutuhkan materi singkat, progres yang jelas, dan review yang terjadwal.

### Content editor/reviewer

- Menambahkan serta memperbaiki terjemahan Indonesia atau Korea.
- Membandingkan terjemahan dengan teks Inggris kanonis.
- Memindahkan status terjemahan dari draft menjadi reviewed dan published.
- Meninjau ulang terjemahan saat materi sumber OpenJLPT berubah.

### Administrator

- Mengelola role editor/reviewer.
- Menjalankan atau memantau sinkronisasi OpenJLPT.
- Melihat coverage terjemahan, konflik sinkronisasi, dan laporan kesalahan materi.
- Tidak boleh mengubah materi kanonis melalui aplikasi.

## 4. Ruang lingkup

### Termasuk dalam v1

- Registrasi, login email/password, login Google, logout, dan pemulihan akses akun.
- Pemilihan bahasa tampilan dan bahasa materi: Inggris, Indonesia, atau Korea.
- Pemilihan target JLPT N5–N1.
- Dashboard progres, target harian, streak, dan review yang jatuh tempo.
- Katalog serta pencarian vocabulary, kanji, dan grammar.
- Halaman detail materi dan contoh kalimat jika tersedia.
- Sesi belajar harian berbentuk flashcard dan kuis.
- Spaced repetition untuk menjadwalkan review.
- Penyimpanan progres dan hasil kuis lintas perangkat.
- Translation overlay dengan workflow draft, reviewed, dan published.
- Panel internal minimal untuk editor/reviewer.
- Halaman atribusi, lisensi, disclaimer level JLPT, serta laporan koreksi.
- Sinkronisasi berkala dari versi OpenJLPT yang telah tervalidasi.

### Tidak termasuk dalam v1

- Audio native atau text-to-speech.
- Latihan listening dan reading passage panjang.
- Simulasi ujian resmi atau klaim bahwa soal berasal dari JLPT resmi.
- Aplikasi native iOS/Android.
- Forum, komentar, atau kontribusi terjemahan publik.
- AI tutor atau chat.
- Leaderboard dan kompetisi antarpengguna.
- Pembayaran, subscription, atau fitur premium.

## 5. Struktur web dan fitur

### Information architecture

```text
Kotomichi Learn
├── Public
│   ├── Landing
│   ├── Catalog N5–N1
│   ├── Search
│   ├── Content detail
│   └── Attribution, privacy, terms, dan report
├── Authentication
│   ├── Register, login email/password, login Google, logout
│   ├── Password recovery dan email verification
│   └── Onboarding
├── Learner
│   ├── Dashboard
│   ├── Learning path N5–N1
│   ├── Daily session
│   ├── Flashcard dan quiz
│   ├── Review dan spaced repetition
│   ├── Progress dan statistics
│   └── Profile dan settings
└── Internal
    ├── Translation editor/reviewer
    └── Administration dan source sync
```

### Website publik

| Area | Fitur |
|---|---|
| Landing | Penjelasan produk, pilihan level, contoh materi, fitur utama, dan CTA belajar |
| Catalog | Daftar vocabulary, kanji, dan grammar dengan filter level serta jenis materi |
| Search | Pencarian tulisan Jepang, reading, serta makna Inggris, Indonesia, dan Korea |
| Content detail | Seluruh field kanonis, translation published, fallback, dan contoh kalimat |
| Informasi | About, attribution, sumber data, disclaimer JLPT, privacy, terms, dan report |

Halaman publik dapat dibuka tanpa login. Katalog dan detail materi harus memberikan
preview yang berguna, sedangkan penyimpanan progres lintas perangkat memerlukan akun.

### Authentication dan onboarding

- Mendukung register, login email/password, login Google, logout, password recovery,
  dan verifikasi email.
- Login Google menggunakan provider resmi Supabase Auth dengan alur OAuth PKCE.
- Guest dapat mencoba belajar dengan progres lokal dan menggabungkannya saat membuat akun.
- Onboarding memilih bahasa materi, target JLPT, target harian, dan pengalaman awal.

### Learner dashboard

- Menampilkan target aktif, progres vocabulary/kanji/grammar, streak, target harian,
  accuracy, review jatuh tempo, dan materi terakhir.
- Aksi utama memilih antara melanjutkan materi baru dan menyelesaikan review terpenting.
- Pergantian target atau bahasa tidak menghapus progres yang sudah ada.

### Learning path N5–N1

Setiap level mempunyai struktur yang sama:

```text
Level
├── Vocabulary
├── Kanji
├── Grammar
├── Review
└── Progress
```

Setiap item menggunakan status `new`, `learning`, `review`, atau `mastered`. Pengguna dapat
memfilter katalog berdasarkan status tersebut.

### Daily session, flashcard, dan quiz

- Sesi dapat berisi vocabulary, kanji, grammar, atau campuran materi.
- Pengguna memilih level, jumlah item, materi baru, atau review.
- Flashcard vocabulary menampilkan word, reading, meaning, dan contoh.
- Flashcard kanji menampilkan character, reading, meaning, strokes, dan metadata terkait.
- Flashcard grammar menampilkan pattern, meaning, formation, notes, dan contoh.
- Tipe quiz minimum adalah memilih meaning, memilih reading, recall, dan melengkapi
  kalimat ketika sumber data mencukupi.
- Feedback jawaban menampilkan hasil, jawaban benar, penjelasan, dan contoh sebelum lanjut.

### Review, progress, dan statistics

- Review queue diprioritaskan dari item due, overdue, sering salah, dan hampir mastered.
- Pengguna memberi nilai `forgot`, `hard`, `good`, atau `easy` pada recall.
- Halaman progres menampilkan completion per level dan jenis materi, accuracy, waktu
  belajar, streak, kalender aktivitas, riwayat sesi, dan materi tersulit.
- Progres terikat pada identitas materi, bukan locale atau translation.

### Profile dan settings

- Mengelola nama, avatar, target JLPT, locale, target harian, reminder, dan theme.
- Menyediakan export progres, pengaturan privasi, logout, dan penghapusan akun.
- Light mode menjadi default dan dark mode bersifat opsional.

### Translation editor/reviewer

- Dashboard menampilkan coverage per locale, level, jenis materi, serta status editorial.
- Editor melihat sumber Inggris dan mengisi translation Indonesia atau Korea sebagai draft.
- Reviewer dapat menyetujui, mengembalikan, publish, dan melihat riwayat perubahan.
- Translation yang fingerprint sumbernya berubah masuk antrean `needs_review`.

### Administration

- Mengelola role editor dan reviewer.
- Memantau versi dan sinkronisasi OpenJLPT, diff sumber, konflik, serta rollback snapshot.
- Menangani laporan koreksi, statistik penggunaan, error, dan translation coverage.
- Admin tidak dapat mengubah field kanonis OpenJLPT melalui UI.

## 6. Kebutuhan fungsional

### FR-1 — Akun dan onboarding

- Pengguna dapat membuat akun dan masuk dengan metode yang didukung Supabase Auth.
- Setelah login pertama, pengguna memilih bahasa materi dan target JLPT.
- Default bahasa adalah Indonesia jika locale browser diawali `id`, Korea jika diawali
  `ko`, dan Inggris untuk locale lainnya.
- Default target adalah N5 dan dapat diganti kapan saja tanpa menghapus progres.
- Pengguna dapat belajar sebagai guest dengan progres lokal; sinkronisasi lintas perangkat
  memerlukan akun.
- Saat guest membuat akun, progres lokal digabungkan sekali dengan progres akun tanpa
  menduplikasi attempt yang sama.

### FR-2 — Dashboard

- Dashboard menampilkan target level, progres per jenis materi, streak, target harian, dan
  jumlah review yang jatuh tempo.
- Aksi utama selalu melanjutkan materi baru atau review paling mendesak.
- Progres vocabulary, kanji, dan grammar ditampilkan terpisah.
- Pergantian bahasa tidak menghapus progres karena identitas materi tidak bergantung pada
  bahasa.

### FR-3 — Katalog dan pencarian

- Pengguna dapat memilih N5, N4, N3, N2, atau N1.
- Katalog dapat difilter berdasarkan jenis materi dan status belajar.
- Pencarian mencakup tulisan Jepang, reading, makna Inggris, serta terjemahan Indonesia
  atau Korea yang berstatus published.
- Hasil pencarian menampilkan level, jenis materi, reading/pattern, dan makna dalam bahasa
  pilihan pengguna.
- Jika overlay tidak tersedia, hasil menggunakan bahasa Inggris dan menampilkan indikator
  fallback.

### FR-4 — Detail materi

- Vocabulary menampilkan word, reading, level, meanings, dan contoh kalimat.
- Kanji menampilkan karakter, level, onyomi, kunyomi, meanings, strokes, grade, dan
  frequency jika tersedia.
- Grammar menampilkan pattern, meaning, formation, tags, notes, dan contoh jika tersedia.
- Field Jepang dan metadata kanonis selalu berasal langsung dari snapshot OpenJLPT aktif.
- Makna serta penjelasan memilih overlay published sesuai locale, lalu fallback ke Inggris.
- Teks Inggris sumber tetap dapat dilihat untuk transparansi terjemahan.

### FR-5 — Sesi belajar dan kuis

- Pengguna dapat memulai sesi berdasarkan level, jenis materi, dan jumlah item.
- Sesi menggabungkan materi baru dengan review yang jatuh tempo.
- Tipe latihan minimum mencakup flashcard, memilih makna, memilih reading, dan recall.
- Pertanyaan hanya dibuat dari field yang tersedia; item tanpa contoh tidak menghasilkan
  pertanyaan berbasis contoh.
- Setelah menjawab, pengguna melihat jawaban, penjelasan, dan contoh yang tersedia.
- Hasil setiap item disimpan secara idempotent agar retry tidak menggandakan progres.

### FR-6 — Progres dan spaced repetition

- Status item minimal adalah `new`, `learning`, `review`, dan `mastered`.
- Jawaban memperbarui accuracy, jumlah attempt, last reviewed, dan next review.
- Algoritma review berada pada domain layer dan tidak bergantung pada komponen UI.
- Perubahan bahasa, spelling UI, atau pembaruan terjemahan tidak mereset jadwal review.
- Perubahan identitas materi OpenJLPT masuk antrean rekonsiliasi sebelum progres dipindah.

### FR-7 — Terjemahan Indonesia dan Korea

- Overlay hanya boleh menerjemahkan field yang berasal dari bahasa Inggris:
  - Vocabulary: `meanings` dan terjemahan contoh.
  - Kanji: `meanings`.
  - Grammar: `meaning`, `formation`, `notes`, `tags`, dan terjemahan contoh.
- Word, reading, character, onyomi, kunyomi, pattern, level, serta kalimat Jepang tidak
  boleh ditimpa overlay.
- Status translation adalah `draft`, `reviewed`, `published`, atau `needs_review`.
- Learner hanya melihat translation berstatus `published`.
- Editor dapat membuat dan memperbarui draft. Reviewer dapat publish atau mengembalikan
  translation ke draft.
- Machine translation boleh membantu draft, tetapi tidak boleh dipublish otomatis.
- Setiap translation menyimpan bahasa, editor, reviewer, timestamp, source fingerprint,
  dan catatan perubahan.
- Perubahan pada field Inggris sumber mengubah fingerprint dan otomatis menandai
  translation terkait sebagai `needs_review`.
- Coverage dihitung per bahasa, level, jenis materi, dan field wajib.

### FR-8 — Sinkronisasi OpenJLPT

- Aplikasi hanya mengonsumsi release atau commit OpenJLPT yang telah lolos schema
  validation.
- Snapshot aktif menyimpan versi/commit, waktu impor, dan checksum dataset.
- Sinkronisasi membandingkan item added, changed, moved-level, dan removed.
- Sinkronisasi tidak boleh mengubah atau menghapus progres serta translation secara diam-
  diam.
- Item berubah memicu review translation berdasarkan fingerprint.
- Item hilang dinonaktifkan dari sesi baru, tetapi riwayat pengguna tetap dipertahankan.
- Aktivasi snapshot baru bersifat atomik dan dapat dikembalikan ke snapshot sebelumnya.
- Proses refresh mengikuti jadwal OpenJLPT; pemeriksaan update dilakukan minimal bulanan.

### FR-9 — Attribution dan koreksi

- Footer publik memiliki tautan permanen menuju halaman `/attributions`.
- Halaman atribusi memberi kredit kepada OpenJLPT, JMdict/EDICT dan KANJIDIC2 (EDRDG),
  Jonathan Waller's JLPT Resources, serta Tatoeba.
- Halaman menyertakan tautan CC BY-SA 4.0 dan CC BY 2.0 FR yang relevan.
- Halaman menjelaskan bahwa pembagian level adalah perkiraan komunitas dan bukan daftar
  resmi Japan Foundation/JLPT.
- Terjemahan Indonesia dan Korea dinyatakan sebagai adapted material dan didistribusikan
  di bawah CC BY-SA 4.0.
- Pengguna dapat melaporkan kesalahan dengan menyertakan materi, level, locale, dan field.
- Koreksi data kanonis diarahkan ke OpenJLPT atau upstream yang relevan; koreksi translation
  ditangani di overlay.

## 7. Model konten dan SSOT

### Prinsip sumber data

```text
OpenJLPT validated snapshot
  ├── canonical Japanese fields
  ├── canonical English fields
  └── JLPT level and metadata
              │
              │ one-way validated import
              ▼
Supabase source tables
  ├── vocab
  ├── kanji
  └── grammar
              │
              ├──────────────┐
              ▼              ▼
Translation overlay      User progress
  ├── Indonesia              │
  └── Korea                  │
              │              │
              └──────┬───────┘
                     ▼
          Localized learning view
```

- OpenJLPT selalu menang jika terjadi konflik pada field kanonis.
- Tabel `vocab`, `kanji`, dan `grammar` di Supabase adalah serving copy yang hanya dapat
  diperbarui oleh import satu arah dari OpenJLPT tervalidasi.
- Overlay tidak meng-copy seluruh entry; hanya locale, field translation, status, dan
  metadata editorial.
- Progres menunjuk identitas konten, bukan translation tertentu.
- UI tidak boleh menjadikan hasil edit translation sebagai sumber untuk memperbarui
  OpenJLPT.

### Identitas materi

Karena schema OpenJLPT saat ini belum menyediakan ID, referensi memakai composite identity:

| Tipe | Composite identity |
|---|---|
| Vocabulary | `type + level + word + reading` |
| Kanji | `type + level + character` |
| Grammar | `type + level + pattern` |

Komponen identity disimpan sebagai kolom terstruktur, bukan string gabungan yang di-parse.
Kombinasi tersebut tidak memiliki duplikasi pada snapshot repository saat PRD ini dibuat.
Setiap entry juga menyimpan `source_fingerprint` dari field kanonis agar perubahan sumber
dapat dideteksi.

### Entitas produk

| Entitas | Fungsi |
|---|---|
| `source_snapshots` | Versi, commit, checksum, status, dan waktu aktivasi OpenJLPT |
| `vocab` | Serving copy vocabulary Inggris dan Jepang dari snapshot aktif |
| `kanji` | Serving copy kanji Inggris dan Jepang dari snapshot aktif |
| `grammar` | Serving copy grammar Inggris dan Jepang dari snapshot aktif |
| `vocab_translations` | Meaning dan terjemahan contoh untuk locale `id`/`ko` |
| `kanji_translations` | Meaning kanji untuk locale `id`/`ko` |
| `grammar_translations` | Meaning, formation, notes, tags, dan contoh untuk locale `id`/`ko` |
| `profiles` | Locale, target level, target harian, dan preferensi pengguna |
| `learning_progress` | Status belajar, accuracy, attempt, dan jadwal review per item |
| `quiz_attempts` | Riwayat sesi dan jawaban yang diperlukan untuk analitik belajar |
| `content_reports` | Laporan koreksi kanonis atau translation |

Tabel pengguna wajib memakai Row Level Security. Translation dan snapshot hanya dapat
dimutasi oleh role editorial atau administrator.

## 8. Kebutuhan nonfungsional

### Usability dan aksesibilitas

- Mobile-first dan mengikuti [`design.md`](./design.md).
- Memenuhi WCAG 2.2 AA untuk kontras, keyboard, focus, label form, dan screen reader.
- Ukuran body minimal 16px dan line-height Jepang minimal 1.7.
- Status tidak boleh disampaikan melalui warna saja.

### Performa

- Target LCP maksimal 2,5 detik pada persentil ke-75 halaman learner.
- Respons pencarian server maksimal 500 ms pada persentil ke-95 untuk dataset aktif.
- Jangan mengirim seluruh dataset ke browser jika halaman hanya membutuhkan sebagian item.
- Materi read-only dapat di-cache; session dan progres pengguna tidak boleh masuk cache
  publik.

### Keamanan dan privasi

- Seluruh data pengguna dilindungi Supabase RLS.
- Secret/service-role key tidak pernah dikirim ke browser.
- Input divalidasi di server dan operasi progres dibuat idempotent.
- Log tidak boleh memuat token, cookie, secret, atau data pribadi lengkap.
- Pengguna dapat menghapus akun dan data progres miliknya.

### Reliability

- Snapshot lama tetap tersedia untuk rollback.
- Kegagalan sinkronisasi tidak memengaruhi snapshot aktif.
- Penulisan attempt dan progres harus konsisten pada retry.
- Error monitoring membedakan error aplikasi, auth, database, dan data sync.

## 9. Analitik

Event minimum:

- `onboarding_completed`
- `learning_session_started`
- `learning_item_answered`
- `learning_session_completed`
- `review_due_opened`
- `content_searched`
- `content_fallback_shown`
- `translation_report_submitted`

Event hanya mengirim identifier internal, level, content type, locale, hasil, dan durasi
yang diperlukan. Jangan mengirim teks jawaban bebas atau data sensitif. Dashboard internal
menampilkan activation, completion, retention, accuracy, review completion, fallback rate,
dan translation coverage.

## 10. Tahapan delivery

### Phase 1 — Foundation dan catalog

- Menyiapkan web, auth, profil, design system, OpenJLPT adapter, snapshot, dan attribution.
- Menyediakan katalog, detail, pencarian, locale selector, serta fallback Inggris.
- Menyediakan translation workflow dan coverage dashboard.

### Phase 2 — Learning loop

- Menambahkan dashboard learner, sesi belajar, kuis, progres, streak, dan spaced repetition.
- Menambahkan guest mode dan migrasi progres saat membuat akun.
- Menambahkan unit, integration, RLS, dan E2E test untuk alur kritis.

### Phase 3 — Translation rollout

- Menyelesaikan serta mereview Indonesia dan Korea mulai N5, lalu N4 hingga N1.
- Bahasa dapat dipilih sejak awal, tetapi label “tersedia penuh” hanya diberikan setelah
  seluruh field wajib pada level tersebut berstatus published.
- Menjalankan quality review dan memperbaiki fallback rate sebelum memperluas level.

### Phase 4 — Production hardening

- Mengaktifkan analytics, error monitoring, backup, rollback snapshot, dan data sync
  bulanan.
- Menjalankan accessibility, performance, security, dan license compliance audit.
- Membuka beta bertahap sebelum rilis publik.

## 11. Acceptance criteria v1

V1 dinyatakan selesai ketika:

1. Pengguna dapat memilih dan mempelajari materi vocabulary, kanji, serta grammar pada
   semua level N5–N1.
2. Bahasa Inggris selalu tersedia; overlay Indonesia dan Korea yang published ditampilkan
   sesuai locale dan fallback bekerja per field.
3. Pengguna dapat menyelesaikan sesi, menerima jadwal review, dan melanjutkan progres dari
   perangkat lain.
4. Perubahan bahasa tidak mengubah identitas atau mereset progres.
5. Editor dapat membuat draft dan reviewer dapat publish translation.
6. Perubahan sumber Inggris menandai translation terkait sebagai `needs_review`.
7. Sinkronisasi dapat mengaktifkan snapshot baru tanpa downtime dan rollback jika gagal.
8. RLS test membuktikan pengguna tidak dapat membaca atau mengubah progres pengguna lain.
9. Katalog, sesi belajar, serta alur login utama lolos test keyboard dan WCAG 2.2 AA.
10. Footer dan halaman atribusi memenuhi kewajiban di `NOTICE.md` dan dapat diakses tanpa
    login.
11. Semua quality gate di [`tech-stack.md`](./tech-stack.md) berhasil.

## 12. Asumsi dan keputusan

- OpenJLPT adalah SSOT. Supabase menyimpan serving copy yang diimpor satu arah dan tidak
  boleh diedit manual.
- Bahasa Inggris adalah fallback kanonis untuk seluruh locale.
- Terjemahan Indonesia dan Korea adalah overlay editorial dan merupakan adapted material
  CC BY-SA 4.0.
- Semua level tersedia sejak awal dengan fallback Inggris; translation diluncurkan
  bertahap mulai N5.
- Daftar level OpenJLPT adalah perkiraan komunitas, bukan daftar resmi JLPT.
- Akun menggunakan Supabase Auth dan progres disimpan di PostgreSQL.
- Light mode menjadi default; dark mode bersifat opsional.
- Web adalah platform pertama; API publik, audio, native mobile, dan monetisasi berada di
  luar v1.
