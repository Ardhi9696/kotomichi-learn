# Taxonomy vocabulary N5/N4

Klasifikasi awal hanya mencakup vocabulary N5 dan N4 agar cakupan review tetap
terkendali. Satu kata dapat memiliki lebih dari satu kelas kata atau tema.

## Dimensi

- Kelas kata: noun, verb, adjective, other.
- Kelompok verba: godan, ichidan, irregular.
- Transitivitas: transitive, intransitive.
- Jenis adjektiva: i, na.
- Tema: angka & satuan, diri & keluarga, waktu & cuaca, kehidupan sehari-hari,
  makanan & minuman, sekolah & pekerjaan, perjalanan & tempat, alam & kesehatan,
  serta komunikasi & perasaan.

Metadata gramatikal berasal dari tag JMdict. Tema berasal dari makna Inggris
OpenJLPT dan aturan keyword Kotomichi. Row menyimpan sumber, referensi JMdict,
confidence, dan status `needs_review`. Koreksi melalui editor mengubah sumber
menjadi `editorial`; seed berikutnya tidak menimpa koreksi tersebut.

## Regenerasi seed

Siapkan:

- `/tmp/openjlpt-n5.json`
- `/tmp/openjlpt-n4.json`
- `/tmp/jmdict-eng-3.6.2.json` (atau berikan path JMdict sebagai argumen)

Lalu jalankan:

```bash
node scripts/classify-vocabulary-n5-n4.mjs
```

Script menulis ulang
`supabase/migrations/20260727083000_seed_vocabulary_taxonomy_n5_n4.sql` dan
menampilkan ringkasan coverage. Perubahan aturan atau versi sumber harus direview
sebagai migration baru, bukan mengubah migration yang sudah diterapkan.
