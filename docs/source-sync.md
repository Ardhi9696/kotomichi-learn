# Sinkronisasi OpenJLPT

Sinkronisasi manual dijalankan oleh superadmin melalui `/admin/sources`. Importer
membaca file JSON di browser, memvalidasinya, lalu mengirim data ke Supabase dalam
batch 250 item. Snapshot tidak memengaruhi katalog sampai diaktifkan.

## Format manifest

```json
{
  "source_version": "2026-07-27",
  "source_commit": "full-or-short-commit-sha",
  "dataset_checksum": "sha256-64-karakter-heksadesimal",
  "vocabulary": [
    {
      "level": "N5",
      "word": "水",
      "reading": "みず",
      "meanings": ["water"],
      "examples": [{ "ja": "水を飲みます。", "en": "I drink water." }]
    }
  ],
  "kanji": [
    {
      "level": "N5",
      "character": "水",
      "onyomi": ["スイ"],
      "kunyomi": ["みず"],
      "meanings": ["water"],
      "strokes": 4,
      "grade": 1,
      "frequency": 223
    }
  ],
  "grammar": [
    {
      "level": "N5",
      "pattern": "〜です",
      "meaning": "to be",
      "formation": "Noun + です",
      "examples": [],
      "tags": ["copula"],
      "notes": ""
    }
  ]
}
```

Semua tiga keluarga materi wajib berisi setidaknya satu item. `dataset_checksum`
adalah SHA-256 dari dataset sumber yang dinormalisasi; fingerprint setiap item
dihitung kembali oleh PostgreSQL.

## Alur aman

1. Unduh atau checkout revisi OpenJLPT yang akan digunakan.
2. Normalisasi data ke format manifest di atas dan hitung SHA-256.
3. Impor melalui `/admin/sources`.
4. Periksa diff `added`, `changed`, `moved`, `removed`, dan `unchanged`.
5. Aktifkan hanya setelah jumlah dan diff sesuai ekspektasi.
6. Jika ditemukan regresi, pilih snapshot berstatus `archived` lalu gunakan tombol
   rollback.

Jika koneksi terputus ketika upload, pilih file yang sama lagi. Kombinasi versi dan
checksum yang masih `importing` atau `failed` akan dilanjutkan secara idempoten.

Aktivasi dilakukan dalam satu transaksi database. Materi yang tidak terdapat pada
snapshot baru dinonaktifkan, bukan dihapus, sehingga progres dan histori pengguna
tetap tersimpan. Perubahan fingerprint otomatis mengembalikan translation terkait
ke status `needs_review`.
