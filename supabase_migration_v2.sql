-- ============================================================
-- LAMOENAN POS — SQL MIGRATION v2
-- Jalankan di Supabase SQL Editor (satu kali)
-- ============================================================

-- 1. VARIAN MENU
-- Menyimpan opsi varian per menu (ukuran, suhu, dll)
CREATE TABLE IF NOT EXISTS menu_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  group_name text NOT NULL,        -- contoh: "Ukuran", "Suhu", "Tingkat Manis"
  options jsonb NOT NULL DEFAULT '[]',
  -- options format: [{"label": "Small", "price_adj": 0}, {"label": "Large", "price_adj": 5000}]
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. MANAJEMEN MEJA
-- Menyimpan daftar meja cafe
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,              -- contoh: "Meja 1", "Meja VIP"
  capacity int DEFAULT 4,
  status text DEFAULT 'available', -- 'available' | 'occupied'
  created_at timestamptz DEFAULT now()
);

-- Tambah kolom table_id di orders (opsional)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id uuid REFERENCES tables(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_name text; -- simpan nama meja saat order

-- 3. SHIFT KASIR
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by uuid REFERENCES auth.users(id),
  opener_email text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  opening_cash numeric DEFAULT 0,
  closing_cash numeric,
  total_sales numeric DEFAULT 0,
  transaction_count int DEFAULT 0,
  status text DEFAULT 'open',      -- 'open' | 'closed'
  notes text
);

-- 4. VOID TRANSAKSI
-- Tambah kolom void di orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS void_reason text;

-- 5. SEED DATA MEJA (Opsional — sesuaikan dengan jumlah meja cafe)
INSERT INTO tables (name, capacity) VALUES
  ('Meja 1', 4),
  ('Meja 2', 4),
  ('Meja 3', 4),
  ('Meja 4', 2),
  ('Meja 5', 2),
  ('Meja 6', 6),
  ('Meja VIP', 8),
  ('Take Away', 1)
ON CONFLICT DO NOTHING;

-- 6. RLS POLICIES (Row Level Security)
ALTER TABLE menu_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read menu_variants" ON menu_variants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage menu_variants" ON menu_variants FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read tables" ON tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage tables" ON tables FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shifts" ON shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shifts" ON shifts FOR ALL USING (auth.role() = 'authenticated');
