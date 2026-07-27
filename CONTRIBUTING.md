# Contributing to Kotomichi Learn

Terima kasih telah membantu mengembangkan Kotomichi Learn.

## Alur kerja

1. Baca [`prd.md`](./prd.md), [`design.md`](./design.md), dan
   [`tech-stack.md`](./tech-stack.md).
2. Buat perubahan kecil dengan scope yang jelas.
3. Jangan memasukkan secret, dump database, atau dataset OpenJLPT ke repository.
4. Buat migration untuk setiap perubahan schema Supabase.
5. Jalankan seluruh quality gate sebelum membuka pull request.

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Materi kanonis tidak diedit melalui aplikasi. Koreksi sumber diarahkan ke OpenJLPT atau
upstream terkait; terjemahan Indonesia dan Korea dikelola sebagai overlay Kotomichi.
