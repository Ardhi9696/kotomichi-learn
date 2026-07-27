# Kotomichi Learn Design System

Dokumen ini menjadi acuan warna dan tipografi untuk web Kotomichi Learn. Arah visual yang
digunakan adalah **Shinto Shrine**: identitas Jepang yang kuat, energik, tetapi tetap
nyaman untuk sesi belajar yang panjang.

## Color

### Palet utama

| Token | Warna | Penggunaan |
|---|---|---|
| `primary` | `#C92C23` | Tombol utama, navigasi aktif, indikator progres, dan tautan penting |
| `primary-hover` | `#A9231C` | Hover dan pressed state untuk elemen primary |
| `primary-soft` | `#FBE9E7` | Latar badge, pilihan aktif, dan highlight lembut |
| `foreground` | `#1C1C1C` | Judul, body text, dan ikon utama |
| `muted-foreground` | `#6B6762` | Teks pendukung, label, dan metadata |
| `background` | `#F7F6F0` | Latar utama halaman |
| `surface` | `#FFFFFF` | Card, dialog, input, dan area materi |
| `border` | `#E6E1D8` | Border card, input, divider, dan separator |
| `accent` | `#D4AF37` | Streak, achievement, badge premium, dan detail dekoratif |

### Proporsi penggunaan

Gunakan komposisi berikut sebagai panduan umum:

- 70% `background`
- 20% `surface` dan `foreground`
- 10% `primary`, `primary-soft`, dan `accent`

Merah tidak digunakan sebagai latar area konten yang besar. Warna tersebut harus tetap
menjadi penanda aksi dan status penting agar halaman tidak melelahkan mata.

### Aturan penggunaan

#### Primary

- Gunakan `primary` untuk satu aksi utama pada setiap area.
- Gunakan teks putih pada tombol primary.
- Gunakan `primary-hover` untuk hover, pressed, dan focus emphasis.
- Gunakan `primary-soft` untuk pilihan aktif yang tidak memerlukan warna solid.
- Hindari memakai merah pada semua judul; gunakan `foreground` untuk hierarki teks utama.

#### Accent

- Gunakan emas secara hemat untuk streak, pencapaian, dan elemen perayaan.
- Jangan gunakan `accent` sebagai warna body text atau tombol dengan teks putih.
- Untuk teks di atas latar emas, gunakan `foreground`.

#### Background dan surface

- Halaman menggunakan `background`.
- Card materi, flashcard, kuis, dialog, dan input menggunakan `surface`.
- Gunakan `border` untuk memisahkan area sebelum menambahkan shadow.

### Aksesibilitas

- Kombinasi `primary` dengan putih memiliki contrast ratio sekitar **5.43:1** dan memenuhi
  WCAG AA untuk teks normal.
- Kombinasi `foreground` dengan `background` memiliki contrast ratio sekitar **15.74:1**.
- Jangan memasangkan `primary` dan `foreground` sebagai kombinasi teks dan latar karena
  kontrasnya tidak cukup untuk teks normal.
- Jangan menyampaikan status hanya melalui warna. Sertakan ikon, label, atau pesan.
- Focus ring harus tetap terlihat pada background terang maupun surface putih.

### CSS design tokens

```css
:root {
  --color-primary: #c92c23;
  --color-primary-hover: #a9231c;
  --color-primary-soft: #fbe9e7;

  --color-foreground: #1c1c1c;
  --color-muted-foreground: #6b6762;

  --color-background: #f7f6f0;
  --color-surface: #ffffff;
  --color-border: #e6e1d8;

  --color-accent: #d4af37;

  --color-focus-ring: #c92c23;
}
```

Contoh tombol utama:

```css
.button-primary {
  color: #ffffff;
  background: var(--color-primary);
}

.button-primary:hover,
.button-primary:active {
  background: var(--color-primary-hover);
}

.button-primary:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

### Dark mode

Dark mode bersifat opsional dan menggunakan nuansa **Imperial Crimson** tanpa mengubah
identitas primary:

```css
[data-theme="dark"] {
  --color-primary: #dc271b;
  --color-primary-hover: #ee3b30;
  --color-primary-soft: #3a1715;

  --color-foreground: #f7f6f0;
  --color-muted-foreground: #b9b1a7;

  --color-background: #111111;
  --color-surface: #1a1a1a;
  --color-border: #33302d;

  --color-accent: #d4af37;
  --color-focus-ring: #ee3b30;
}
```

Light mode tetap menjadi tampilan default karena lebih sesuai untuk membaca materi,
flashcard, dan mengerjakan kuis dalam waktu lama.

## Typography

Sistem tipografi memadukan karakter tradisional Jepang dengan UI modern. Font serif hanya
digunakan sebagai aksen, sedangkan materi dan kontrol aplikasi selalu memakai sans-serif
agar mudah dibaca.

### Font families

| Peran | Font | Penggunaan |
|---|---|---|
| Sans/UI | `Plus Jakarta Sans`, `Noto Sans JP` | Navigasi, tombol, body text, form, kuis, dan dashboard |
| Serif/Display | `Noto Serif JP` | Hero heading, judul halaman utama, kutipan, dan aksen editorial |
| Display opsional | `Shippori Mincho` | Kampanye atau elemen dekoratif yang sangat terbatas |

Urutan sans-serif sengaja menempatkan `Plus Jakarta Sans` untuk karakter Latin dan
`Noto Sans JP` sebagai fallback karakter Jepang. Teks Jepang tetap mendapatkan glyph dari
Noto Sans JP tanpa memerlukan style terpisah.

### Font weights

| Weight | Penggunaan |
|---|---|
| `400` | Body text, deskripsi, dan materi |
| `500` | Label, navigasi, dan jawaban kuis |
| `600` | Subjudul, judul card, dan tombol |
| `700` | Heading utama dan angka progres |

Hindari weight di bawah `400` untuk karakter Jepang karena guratannya menjadi terlalu
tipis pada layar kecil.

### Type scale

| Token | Ukuran / line-height | Penggunaan |
|---|---|---|
| `display` | `48px / 1.2` | Hero desktop |
| `heading-1` | `36px / 1.25` | Judul halaman |
| `heading-2` | `28px / 1.3` | Judul section |
| `heading-3` | `22px / 1.4` | Judul card |
| `body-lg` | `18px / 1.75` | Materi utama dan contoh kalimat |
| `body` | `16px / 1.7` | Body text dan UI |
| `body-sm` | `14px / 1.6` | Label dan metadata |
| `caption` | `12px / 1.5` | Keterangan tambahan |

Pada layar kecil, gunakan `36px` untuk `display` dan `30px` untuk `heading-1`. Ukuran body
utama tidak boleh lebih kecil dari `16px`.

### Typography tokens

```css
:root {
  --font-sans:
    "Plus Jakarta Sans", "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --font-serif: "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", serif;
  --font-display-jp: "Shippori Mincho", var(--font-serif);

  --text-display: 3rem;
  --text-heading-1: 2.25rem;
  --text-heading-2: 1.75rem;
  --text-heading-3: 1.375rem;
  --text-body-lg: 1.125rem;
  --text-body: 1rem;
  --text-body-sm: 0.875rem;
  --text-caption: 0.75rem;
}

body {
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  font-weight: 400;
  line-height: 1.7;
}

h1,
h2 {
  font-family: var(--font-serif);
  font-weight: 700;
}
```

### Aturan penggunaan

- Gunakan sans-serif untuk teks panjang, kosakata, furigana, pilihan jawaban, dan semua
  elemen interaktif.
- Gunakan serif maksimal pada satu atau dua elemen menonjol dalam satu layar.
- Jangan gunakan Shippori Mincho untuk body text, label kecil, atau tombol.
- Pertahankan line-height minimal `1.7` untuk paragraf Jepang dan contoh kalimat.
- Jangan mengandalkan perubahan font saja untuk menunjukkan status atau hierarki.
- Pastikan fallback system tetap tersedia jika web font gagal dimuat.

### Rekomendasi loading

- Gunakan file `woff2` dan subset Latin serta Japanese yang diperlukan.
- Preload hanya font yang terlihat di atas fold.
- Gunakan `font-display: swap` agar teks tidak tersembunyi saat font dimuat.
- Batasi font awal pada `Plus Jakarta Sans`, `Noto Sans JP`, dan `Noto Serif JP`.
- Muat Shippori Mincho hanya pada halaman yang benar-benar menggunakannya.
