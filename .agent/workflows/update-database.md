---
description: Cara memperbarui skema database Supabase saat ada fitur baru yang membutuhkan perubahan tabel
---

# Workflow: Update Skema Database Supabase

**PENTING:** Karena database Supabase dikelola lewat dashboard, agent TIDAK BISA menjalankan SQL secara langsung. Ikuti workflow ini untuk setiap perubahan skema.

## Langkah 1: Identifikasi Kebutuhan Perubahan

Tentukan dengan presisi apa yang dibutuhkan:
- Tabel baru? → Gunakan `CREATE TABLE`
- Kolom baru di tabel yang sudah ada? → Gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Kolom yang diubah? → `ALTER TABLE ... ALTER COLUMN`
- Index baru? → `CREATE INDEX IF NOT EXISTS`
- Policy RLS baru? → `CREATE POLICY`

## Langkah 2: Tulis SQL yang Tepat

Berikut template SQL yang sering digunakan dalam project ini:

### Template: Menambah Kolom Baru
```sql
-- Tambahkan kolom [nama_kolom] ke tabel [nama_tabel]
ALTER TABLE public.[nama_tabel]
ADD COLUMN IF NOT EXISTS [nama_kolom] [tipe_data] NOT NULL DEFAULT [nilai_default];
```

### Template: Membuat Tabel Baru
```sql
-- Buat tabel baru [nama_tabel]
CREATE TABLE public.[nama_tabel] (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  -- kolom lainnya di sini
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT [nama_tabel]_pkey PRIMARY KEY (id)
);

-- Aktifkan RLS
ALTER TABLE public.[nama_tabel] ENABLE ROW LEVEL SECURITY;

-- Buat policy akses
CREATE POLICY "Enable read access for all users" ON public.[nama_tabel] FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.[nama_tabel] FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.[nama_tabel] FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.[nama_tabel] FOR DELETE USING (true);
```

### Template: Menambahkan Foreign Key
```sql
-- Tambah relasi foreign key
ALTER TABLE public.[tabel_anak]
ADD CONSTRAINT [tabel_anak]_[kolom]_fkey
FOREIGN KEY ([nama_kolom]) REFERENCES public.[tabel_induk](id) ON DELETE SET NULL;
```

## Langkah 3: Sampaikan SQL ke User

Format instruksi yang harus diberikan ke user:

> Silakan jalankan SQL berikut di **Supabase Dashboard → SQL Editor → New Query**:
> ```sql
> [SQL ANDA DI SINI]
> ```
> Setelah berhasil dijalankan, kabari saya untuk melanjutkan pengembangan kode.

## Langkah 4: Update File `database_schema.sql`

Setelah user mengkonfirmasi SQL berhasil dijalankan:

1. Buka file `c:\Users\hp\lamoenan-pos\database_schema.sql`
2. Tambahkan SQL yang baru dijalankan ke file tersebut sebagai dokumentasi
3. Pastikan file ini selalu up-to-date dengan kondisi database aktual

## Langkah 5: Update Interface TypeScript

Setelah skema database diperbarui, selalu update TypeScript interface yang relevan:
- Jika tabel lama → update interface yang ada di halaman terkait atau `src/types/`
- Jika tabel baru → buat interface baru di `src/types/` atau di file halaman yang bersangkutan
