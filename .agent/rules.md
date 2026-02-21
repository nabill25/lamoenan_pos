# Lamoenan POS – Aturan Pengembangan (Development Rules)

Dokumen ini adalah panduan wajib yang harus diikuti oleh AI agent saat bekerja pada project **Lamoenan Cafe & Bistro POS System**. Semua rules bersifat absolut dan tidak boleh dilanggar 0.1% pun.

---

## 🌐 Bahasa

- **SEMUA dokumen, komentar kode, commit message, dan artifact WAJIB ditulis dalam Bahasa Indonesia.**
- Label UI boleh dalam Bahasa Indonesia atau Inggris sesuai konteks, tetapi komentar dalam kode **wajib Bahasa Indonesia**.

---

## 🏗️ Identitas & Konteks Project

- **Nama Aplikasi:** Lamoenan Cafe & Bistro – POS System
- **Teknologi Utama:** React 19 + Vite + TypeScript + TailwindCSS v3 + Supabase (Backend as a Service)
- **State Management:** Zustand (`src/store/cartStore.ts`)
- **Auth:** Supabase Auth + tabel `user_roles` dengan 3 role: `owner`, `headbar`, `barista`
- **Database:** Supabase PostgreSQL. **JANGAN PERNAH** hardcode URL atau anon key di luar file `.env` dan `inspect_db.js`.
- **Komponen Print:** `react-to-print` digunakan untuk cetak struk (`Receipt.tsx`) dan laporan (`ReportPrint.tsx`)

---

## 📂 Struktur Folder — Aturan Ketat

```
src/
├── context/         → AuthContext.tsx (Provider session & role user)
├── hooks/           → useAuth.tsx (hook akses context auth)
├── store/           → cartStore.ts (Zustand: state keranjang belanja)
├── lib/             → supabase.ts (singleton client Supabase)
├── layouts/         → MainLayout.tsx (sidebar navigasi utama)
├── pages/           → Halaman-halaman utama
│   ├── PosPage.tsx          (Kasir – Antarmuka transaksi utama)
│   ├── OrdersPage.tsx       (Riwayat pesanan/transaksi)
│   ├── StockPage.tsx        (Manajemen stok per menu)
│   ├── InventoryPage.tsx    (Tab Bahan Baku, Kategori, Riwayat)
│   ├── ReportsPage.tsx      (Laporan penjualan + Laba Kotor)
│   ├── MembersPage.tsx      (Data pelanggan/loyalty program)
│   ├── UserPage.tsx         (Manajemen staff & role – khusus owner)
│   └── LoginPage.tsx        (Halaman login Supabase Auth)
│   └── inventory/           (Sub-halaman inventori)
│       ├── IngredientsTab.tsx
│       ├── CategoriesTab.tsx
│       └── StockHistoryTab.tsx
├── components/      → Komponen reusable
│   ├── Receipt.tsx          (Struk cetak per transaksi)
│   └── ReportPrint.tsx      (Laporan cetak PDF/print)
└── types/
    └── inventory.ts         (Interface: Ingredient, IngredientCategory, StockMovement)
```

- **Jangan membuat subfolder baru** tanpa alasan yang sangat kuat.
- **Interface dan type** yang digunakan di lebih dari 1 file WAJIB dipindahkan ke `src/types/`.
- **Jangan membuat store Zustand baru** kecuali cartStore tidak bisa menampung state yang diperlukan.

---

## 🗄️ Database Supabase — Tabel & Kolom (Fakta Aktual)

Berikut adalah tabel yang ada saat ini di Supabase project `ipyoswyljxrmzuyjhhzp`:

| Tabel | Kolom Utama | Keterangan |
|---|---|---|
| `menu_items` | `id`, `name`, `base_price`, `cost`, `stock_quantity`, `image_url`, `is_available`, `category_id` | Menu/produk yang dijual. `cost` = HPP/modal |
| `categories` | `id`, `name` | Kategori menu (join ke `menu_items`) |
| `orders` | `id`, `total_amount`, `discount_amount`, `member_id`, `payment_type`, `status`, `created_at` | Header transaksi |
| `order_items` | `id`, `order_id`, `menu_item_id`, `name`, `price`, `cost`, `quantity` | Detail item per transaksi. `cost` = snapshot HPP saat dijual |
| `members` | `id`, `name`, `phone`, `points`, `created_at` | Program loyalitas pelanggan |
| `profiles` | `id`, `email` | Profil staff (relasi ke Supabase auth.users) |
| `user_roles` | `id`, `user_id`, `role` | Role staff: `owner`, `headbar`, `barista` |
| `ingredients` | `id`, `name`, `unit`, `min_stock`, `current_stock`, `category_id` | Bahan baku |
| `ingredient_categories` | `id`, `name` | Kategori bahan baku |
| `stock_movements` | `id`, `ingredient_id`, `type`, `quantity`, `notes`, `created_by` | Riwayat keluar-masuk stok bahan baku |

**Aturan database:**
1. Selalu gunakan `supabase` dari `src/lib/supabase.ts`. **JANGAN** re-instantiate client di tempat lain.
2. Saat melakukan insert ke tabel baru, PASTIKAN tabel tersebut sudah ada di Supabase terlebih dahulu.
3. Jika ada perubahan schema (ALTER TABLE / ADD COLUMN), WAJIB diinstruksikan ke user untuk dijalankan manual di Supabase SQL Editor.
4. **Dilarang** keras menyimpan data sensitif (seperti PII pelanggan) di tabel yang tidak punya Row Level Security (RLS).

---

## 🔐 Sistem Autentikasi & Hak Akses (Role-Based)

Selalu hormati hierarki role berikut:

| Role | Akses Halaman |
|---|---|
| `barista` | POS, Members, Orders, Reports |
| `headbar` | Semua akses barista + Stock Menu, Bahan Baku (Inventory) |
| `owner` | Semua akses + Staff Management (UserPage) |

- **JANGAN PERNAH** menampilkan menu/fitur yang tidak sesuai role tanpa validasi di `MainLayout.tsx` atau di dalam komponen halaman itu sendiri.
- Selalu gunakan `const { role } = useAuth()` untuk mendapatkan role user yang sedang login.

---

## 💡 Aturan Pengembangan Fitur Baru

1. **Analisis Dulu:** Baca kode yang ada sebelum menulis kode baru. Cegah duplikasi logika.
2. **TypeScript Strict:** Semua interface dan type WAJIB didefinisikan. Hindari `any` kecuali benar-benar terpaksa dan beri komentar alasannya.
3. **Komponen Reusable:** Jika sebuah UI dipakai di lebih dari 1 tempat, jadikan komponen di `src/components/`.
4. **Konsisten dengan Design System:** Gunakan palet warna yang ada: `slate-900` (aksi utama), `amber` (highlight/warning), `indigo` (aksen), `gray` (netral).
5. **Tidak ada `alert()` untuk sukses:** Ganti dengan toast notification atau UI state yang lebih elegan di masa mendatang. Untuk saat ini, `alert()` yang sudah ada boleh dipertahankan tapi pola baru harus menghindarinya.
6. **Format Uang:** Selalu gunakan `.toLocaleString('id-ID')` dan prefix `Rp ` untuk tampilan nilai mata uang Rupiah.
7. **Format Tanggal:** Selalu gunakan `toLocaleDateString('id-ID')` atau `toLocaleString('id-ID')` dengan opsi yang sesuai konteks.

---

## 🚫 Larangan Keras

- ❌ Jangan install library baru tanpa konfirmasi user (kecuali `@types/*`).
- ❌ Jangan hapus atau rename file halaman yang sudah ada tanpa update `App.tsx`.
- ❌ Jangan mengubah skema tabel Supabase (ADD COLUMN, CREATE TABLE) langsung dari kode — beri instruksi SQL ke user.
- ❌ Jangan membuat state global baru jika bisa diatasi dengan `useState` atau `useEffect` lokal.
- ❌ Jangan gunakan TailwindCSS versi 4 atau konfigurasi baru — project ini menggunakan Tailwind v3.
- ❌ Jangan gunakan bahasa Inggris pada dokumentasi agent, komentar kode baru, atau artifact.
