---
description: Cara menambahkan fitur baru ke aplikasi Lamoenan POS
---

# Workflow: Menambahkan Fitur Baru

Ikuti langkah-langkah berikut SECARA URUT tanpa melewatkan satu pun saat akan menambahkan fitur baru ke Lamoenan POS.

## Langkah 1: Analisis Existing Code

Sebelum menulis kode apapun, analisis dulu file-file yang relevan:

1. Baca `src/App.tsx` – apakah perlu route baru?
2. Baca `src/layouts/MainLayout.tsx` – apakah perlu menu navigasi baru?
3. Cari apakah ada halaman/komponen sejenis yang sudah ada menggunakan `grep_search`.
4. Baca `src/store/cartStore.ts` jika fitur berhubungan dengan keranjang/transaksi.
5. Baca file halaman yang akan dimodifikasi secara penuh dari atas ke bawah.

## Langkah 2: Rancang Perubahan Database (Jika Ada)

Jika fitur membutuhkan kolom atau tabel baru di Supabase:

1. Tulis SQL ALTER TABLE / CREATE TABLE yang diperlukan.
2. **JANGAN** jalankan langsung — berikan instruksi SQL kepada user untuk dijalankan di **Supabase Dashboard → SQL Editor**.
3. Tunggu konfirmasi user bahwa SQL sudah dijalankan sebelum melanjutkan ke kode.

Contoh SQL yang harus diberikan ke user:
```sql
-- Contoh: menambahkan kolom baru
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS nama_kolom_baru tipe_data DEFAULT nilai_default;
```

## Langkah 3: Update TypeScript Interface

Jika ada perubahan struktur data:

1. Jika interface hanya dipakai di 1 file → update lokal di file tersebut.
2. Jika interface dipakai di lebih dari 1 file → pindahkan ke `src/types/inventory.ts` atau buat file baru di `src/types/`.
3. Pastikan semua properti opsional menggunakan `?` dan yang wajib ada tidak ada `?`.

## Langkah 4: Implementasi Kode

Urutan implementasi yang benar:

1. **Store (jika perlu):** Update `src/store/cartStore.ts` dulu jika ada state baru yang perlu di-share.
2. **Halaman/Komponen baru:** Buat file di `src/pages/` atau `src/components/`.
3. **Update halaman yang sudah ada:** Jangan lupa update halaman lain yang mungkin terpengaruh.
4. **Routing:** Update `src/App.tsx` jika ada route baru.
5. **Navigasi:** Update `src/layouts/MainLayout.tsx` jika ada menu baru, dengan memperhatikan role yang berhak mengaksesnya.

## Langkah 5: Validasi Hak Akses

Sebelum menyelesaikan fitur, tanya diri sendiri:

- [ ] Apakah fitur ini hanya untuk `owner`?
- [ ] Apakah `headbar` juga perlu akses?
- [ ] Apakah `barista` perlu akses?
- [ ] Sudahkah pembatasan role diimplementasikan di `MainLayout.tsx`?

## Langkah 6: Verifikasi

// turbo
1. Pastikan server dev sudah berjalan: `npm run dev`
2. Buka browser atau gunakan browser subagent untuk verifikasi visual.
3. Cek tidak ada error TypeScript di terminal.
4. Cek tidak ada error di console browser.
