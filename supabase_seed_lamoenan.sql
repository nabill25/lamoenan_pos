-- ============================================================
-- LAMOENAN POS — FIX VARIAN + SEED MENU ASLI
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom variants langsung di menu_items (JSONB)
--    Format: [{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0}]}]
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]';

-- 2. Pastikan tabel-tabel lain dari migration sebelumnya sudah ada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS void_reason text;

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity int DEFAULT 4,
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth can manage tables" ON tables;
CREATE POLICY "auth can manage tables" ON tables FOR ALL USING (auth.role() = 'authenticated');

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
  status text DEFAULT 'open',
  notes text
);
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth can manage shifts" ON shifts;
CREATE POLICY "auth can manage shifts" ON shifts FOR ALL USING (auth.role() = 'authenticated');

-- 3. Seed Data Meja
INSERT INTO tables (name, capacity) VALUES
  ('Meja 1', 4), ('Meja 2', 4), ('Meja 3', 4),
  ('Meja 4', 2), ('Meja 5', 2), ('Meja 6', 6),
  ('Meja VIP', 8), ('Take Away', 1)
ON CONFLICT DO NOTHING;

-- 4. Seed Kategori
INSERT INTO categories (name) VALUES
  ('Frappe'), ('Coffee'), ('Signature'), ('Non Coffee'), ('Toast'), ('Dessert'), ('Add On')
ON CONFLICT DO NOTHING;

-- 5. Seed Menu Lamoenan Cafe
-- Gunakan DO block agar bisa referensi category ID secara dinamis
DO $$
DECLARE
  cat_frappe uuid;
  cat_coffee uuid;
  cat_signature uuid;
  cat_noncoffee uuid;
  cat_toast uuid;
  cat_dessert uuid;
  cat_addon uuid;
BEGIN
  SELECT id INTO cat_frappe FROM categories WHERE name = 'Frappe' LIMIT 1;
  SELECT id INTO cat_coffee FROM categories WHERE name = 'Coffee' LIMIT 1;
  SELECT id INTO cat_signature FROM categories WHERE name = 'Signature' LIMIT 1;
  SELECT id INTO cat_noncoffee FROM categories WHERE name = 'Non Coffee' LIMIT 1;
  SELECT id INTO cat_toast FROM categories WHERE name = 'Toast' LIMIT 1;
  SELECT id INTO cat_dessert FROM categories WHERE name = 'Dessert' LIMIT 1;
  SELECT id INTO cat_addon FROM categories WHERE name = 'Add On' LIMIT 1;

  -- FRAPPE
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Coco Caramelly', 49000, 18000, cat_frappe, '[{"group_name":"Ukuran","is_required":false,"options":[{"label":"Regular","price_adj":0},{"label":"Large","price_adj":5000}]}]'),
    ('Macha Cream', 47000, 17000, cat_frappe, '[{"group_name":"Ukuran","is_required":false,"options":[{"label":"Regular","price_adj":0},{"label":"Large","price_adj":5000}]}]'),
    ('Caramello Cream', 47000, 17000, cat_frappe, '[{"group_name":"Ukuran","is_required":false,"options":[{"label":"Regular","price_adj":0},{"label":"Large","price_adj":5000}]}]'),
    ('Taro Frappe', 43000, 15000, cat_frappe, '[{"group_name":"Ukuran","is_required":false,"options":[{"label":"Regular","price_adj":0},{"label":"Large","price_adj":5000}]}]'),
    ('Regal Frappe', 43000, 15000, cat_frappe, '[{"group_name":"Ukuran","is_required":false,"options":[{"label":"Regular","price_adj":0},{"label":"Large","price_adj":5000}]}]')
  ON CONFLICT DO NOTHING;

  -- COFFEE
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Kopi Melanowen', 29000, 10000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]},{"group_name":"Gula","is_required":false,"options":[{"label":"Normal","price_adj":0},{"label":"Less Sugar","price_adj":0},{"label":"No Sugar","price_adj":0}]}]'),
    ('Regal Latte', 35000, 12000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Americano / Long Black', 25000, 8000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Caffe Latte', 29000, 10000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Cappuccino', 35000, 12000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Caffe Mocha', 36000, 13000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Caramel Macchiato', 36000, 13000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Tiramisu Latte', 40000, 14000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Sea Salt Caramel Latte', 40000, 14000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Cookies Latte', 40000, 14000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Kopi Menteng', 29000, 10000, cat_coffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]')
  ON CONFLICT DO NOTHING;

  -- SIGNATURE
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Black Sunset', 29000, 10000, cat_signature, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Beach In The Morning', 30000, 11000, cat_signature, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Flamingo Breeze', 30000, 11000, cat_signature, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Jakarta Gojel', 32000, 11000, cat_signature, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]')
  ON CONFLICT DO NOTHING;

  -- NON COFFEE
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Matcha Latte', 36000, 13000, cat_noncoffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Oreo Latte', 36000, 13000, cat_noncoffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Cocoa Latte', 36000, 13000, cat_noncoffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Teh Tarik', 25000, 8000, cat_noncoffee, '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
    ('Lemon Tea', 23000, 7000, cat_noncoffee, '[]'),
    ('Lychee Tea', 27000, 9000, cat_noncoffee, '[]'),
    ('Raspberry Tea', 25000, 8000, cat_noncoffee, '[]')
  ON CONFLICT DO NOTHING;

  -- TOAST
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Mentai & Sugar Toast', 25000, 9000, cat_toast, '[]'),
    ('Iniotalia Crunch', 35000, 13000, cat_toast, '[]'),
    ('Choco Crunch', 31000, 11000, cat_toast, '[]'),
    ('Kornet Egg Mayo', 30000, 11000, cat_toast, '[]'),
    ('Mini Kebab - Original', 30000, 11000, cat_toast, '[]'),
    ('Mini Kebab - Triple Sauce', 35000, 13000, cat_toast, '[]')
  ON CONFLICT DO NOTHING;

  -- DESSERT
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Trio Ice Cream', 30000, 11000, cat_dessert, '[{"group_name":"Topping","is_required":false,"options":[{"label":"Strawberry","price_adj":0},{"label":"Chocolate","price_adj":0},{"label":"Blue Vanilla","price_adj":0}]}]'),
    ('Ice Cream Sponge', 14000, 5000, cat_dessert, '[{"group_name":"Topping","is_required":false,"options":[{"label":"Strawberry","price_adj":0},{"label":"Chocolate","price_adj":0},{"label":"Blue Vanilla","price_adj":0}]}]')
  ON CONFLICT DO NOTHING;

  -- ADD ON
  INSERT INTO menu_items (name, base_price, cost, category_id, variants) VALUES
    ('Syrup', 8000, 2000, cat_addon, '[{"group_name":"Rasa","is_required":true,"options":[{"label":"Vanilla","price_adj":0},{"label":"Caramel","price_adj":0},{"label":"Hazelnut","price_adj":0},{"label":"Classic","price_adj":0}]}]'),
    ('Caramel Sauce', 8000, 2000, cat_addon, '[]'),
    ('Crumble', 8000, 2000, cat_addon, '[]'),
    ('Espresso Shot', 8000, 3000, cat_addon, '[]')
  ON CONFLICT DO NOTHING;

END $$;

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';
