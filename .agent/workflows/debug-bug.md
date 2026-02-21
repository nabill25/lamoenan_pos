---
description: Cara mendiagnosis dan memperbaiki bug yang terjadi di aplikasi Lamoenan POS
---

# Workflow: Debug & Perbaikan Bug

Ikuti workflow ini secara sistematis saat ada bug di aplikasi Lamoenan POS.

## Langkah 1: Klasifikasi Bug

Tentukan kategori bug terlebih dahulu:

| Kategori | Ciri-ciri | File yang Dicurigai |
|---|---|---|
| **Bug Supabase/Query** | Error fetch data, data tidak tampil, error RLS | File halaman terkait, `src/lib/supabase.ts` |
| **Bug State/Cart** | Item di keranjang hilang/salah, total salah | `src/store/cartStore.ts`, `src/pages/PosPage.tsx` |
| **Bug Auth/Role** | Halaman tidak bisa diakses, redirect loop | `src/context/AuthContext.tsx`, `src/hooks/useAuth.tsx`, `src/layouts/MainLayout.tsx` |
| **Bug TypeScript** | Error compile, type mismatch | File yang dilaporkan error di terminal |
| **Bug UI/Tampilan** | Layout broken, button tidak berfungsi | File halaman atau komponen yang bersangkutan |
| **Bug Print** | Struk/laporan tidak mencetak dengan benar | `src/components/Receipt.tsx`, `src/components/ReportPrint.tsx` |

## Langkah 2: Kumpulkan Informasi

Sebelum mengubah kode, kumpulkan fakta sebanyak mungkin:

1. Baca pesan error secara lengkap.
2. Baca file yang bermasalah dari atas ke bawah menggunakan `view_file`.
3. Cari pola error yang sama dengan `grep_search`.
4. Jika bug terkait database, cek query Supabase yang digunakan.

## Langkah 3: Perbaikan

Berdasarkan kategori bug:

### Bug Supabase
- Periksa nama tabel dan kolom (cocokkan dengan tabel di rules.md).
- Periksa apakah ada query join yang salah.
- Pastikan policy RLS di Supabase mengizinkan operasi yang dimaksud.
- Cek apakah request mengembalikan `error` dan apakah error tersebut telah di-handle.

### Bug State/Cart
- Baca `cartStore.ts` seluruhnya.
- Periksa urutan operasi `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`.
- Pastikan `CartItem` interface lengkap (termasuk `cost` yang baru ditambahkan).

### Bug Auth/Role
- Debug dengan memeriksa nilai `role` dari `useAuth()`.
- Periksa kondisi `role === 'owner'` di `MainLayout.tsx`.
- Pastikan tabel `user_roles` di Supabase memiliki data untuk user yang login.

### Bug TypeScript
- Jangan gunakan `// @ts-ignore` sebagai solusi permanen.
- Definisikan interface yang benar.
- Jika perlu cast tipe, gunakan `as Type` dengan penjelasan komentar.

## Langkah 4: Verifikasi Perbaikan

// turbo
1. Jalankan `npm run dev` dan pastikan tidak ada error TypeScript di terminal.
2. Coba reproduksi bug — pastikan bug sudah tidak ada.
3. Cek apakah perbaikan tidak merusak fitur lain yang terkait.
