-- ================================================================
-- LAMOENAN CAFE — SEED MENU LENGKAP v4 (dengan gambar)
-- ================================================================

-- 1. Pastikan kolom variants & image_url ada
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]';

-- 2. Pastikan tabel pendukung ada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id uuid;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS void_reason text;

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, capacity int DEFAULT 4, status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth can manage tables" ON tables;
CREATE POLICY "auth can manage tables" ON tables FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by uuid REFERENCES auth.users(id), opener_email text,
  opened_at timestamptz DEFAULT now(), closed_at timestamptz,
  opening_cash numeric DEFAULT 0, closing_cash numeric,
  total_sales numeric DEFAULT 0, transaction_count int DEFAULT 0,
  status text DEFAULT 'open', notes text
);
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth can manage shifts" ON shifts;
CREATE POLICY "auth can manage shifts" ON shifts FOR ALL USING (auth.role() = 'authenticated');

-- 3. Seed meja
INSERT INTO tables (name, capacity) VALUES
  ('Meja 1',4),('Meja 2',4),('Meja 3',4),('Meja 4',2),
  ('Meja 5',2),('Meja 6',6),('Meja VIP',8)
ON CONFLICT DO NOTHING;

-- 4. Kategori
INSERT INTO categories (name) VALUES
  ('Non Coffee'),('Frappuccino'),('Signature'),('Coffee'),
  ('Add On'),('Snack'),('French Fries'),
  ('Sarang Iga'),('Special Chicken'),('Indonesian Taste'),
  ('Japanese Kitchen'),('Dessert')
ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. DEDUPLIKASI AMAN
-- ================================================================

-- a) Pindahkan referensi order_items ke item terbaru per nama
UPDATE order_items oi
SET menu_item_id = winner.id
FROM (
  SELECT DISTINCT ON (name) id, name FROM menu_items ORDER BY name, created_at DESC
) AS winner
JOIN menu_items loser ON loser.name = winner.name AND loser.id != winner.id
WHERE oi.menu_item_id = loser.id;

-- b) Hapus duplikat yang sudah tidak direferensi
DELETE FROM menu_items
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id FROM menu_items ORDER BY name, created_at DESC
)
AND id NOT IN (
  SELECT DISTINCT menu_item_id FROM order_items WHERE menu_item_id IS NOT NULL
);

-- ================================================================
-- 6. UPDATE & INSERT MENU + GAMBAR
-- ================================================================

-- Shorthand varian umum (pakai sebagai teks, di-cast ke jsonb di bawah)
-- Suhu: [{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]
-- Kosong: []

WITH menu_data(mname, price, cost, cat_name, img, variants) AS (VALUES
  -- ── NON COFFEE ────────────────────────────────────────────────
  ('Matcha Latte',    30000,11000,'Non Coffee',
    'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]},{"group_name":"Gula","is_required":false,"options":[{"label":"Normal","price_adj":0},{"label":"Less Sugar","price_adj":0},{"label":"No Sugar","price_adj":0}]}]'),
  ('Cocoa Latte',     30000,10000,'Non Coffee',
    'https://images.unsplash.com/photo-1605024126085-ba7e43083e5c?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Oreo Latte',      25000, 9000,'Non Coffee',
    'https://images.unsplash.com/photo-1621934051292-4748c2140bd2?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Teh Tarik',       25000, 8000,'Non Coffee',
    'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Raspberry Tea',   29000, 9000,'Non Coffee',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80','[]'),
  ('Lychee Tea',      23000, 7000,'Non Coffee',
    'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&q=80','[]'),
  ('Lemon Tea',       23000, 7000,'Non Coffee',
    'https://images.unsplash.com/photo-1587398692-5e2e34dab1c2?w=400&q=80','[]'),
  ('Teh Poci',        20000, 6000,'Non Coffee',
    'https://images.unsplash.com/photo-1597481499750-3e6b22637536?w=400&q=80','[]'),
  ('Sweet Tea',       15000, 4000,'Non Coffee',
    'https://images.unsplash.com/photo-1597481499750-3e6b22637536?w=400&q=80','[]'),
  ('Wedang Jahe',     17000, 5000,'Non Coffee',
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80','[]'),
  ('Air Mineral',     10000, 2000,'Non Coffee',
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80','[]'),

  -- ── FRAPPUCCINO ───────────────────────────────────────────────
  ('Matcha Cream',    23000, 8000,'Frappuccino',
    'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80','[]'),
  ('Taro Frapp',      23000, 8000,'Frappuccino',
    'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80','[]'),
  ('Coco Caramelly',  23000, 8000,'Frappuccino',
    'https://images.unsplash.com/photo-1615485736973-9ed6d7e29d86?w=400&q=80','[]'),
  ('Caramella Cream', 23000, 8000,'Frappuccino',
    'https://images.unsplash.com/photo-1572490122747-3e92036d0377?w=400&q=80','[]'),
  ('Regal Frapp',     23000, 8000,'Frappuccino',
    'https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=400&q=80','[]'),

  -- ── SIGNATURE ─────────────────────────────────────────────────
  ('Kopi Melamoen',        25000, 9000,'Signature',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Jakarta Cloud',        27000,10000,'Signature',
    'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Flaminggo Breeze',     27000,10000,'Signature',
    'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Black Sunset',         25000, 9000,'Signature',
    'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Beach in the Morning', 25000, 9000,'Signature',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Kopurma',              25000, 9000,'Signature',
    'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Aurora Blanc',         35000,13000,'Signature',
    'https://images.unsplash.com/photo-1526743688-2caa2ddc2d05?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Blue Sky',             30000,11000,'Signature',
    'https://images.unsplash.com/photo-1529925130-6b4dc3c6a948?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),

  -- ── COFFEE ────────────────────────────────────────────────────
  ('Sea Salt Caramel Latte', 35000,13000,'Coffee',
    'https://images.unsplash.com/photo-1561882468-9110d70d3339?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Single/Double Espresso', 15000, 5000,'Coffee',
    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80','[]'),
  ('Americano / Long Black', 20000, 7000,'Coffee',
    'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cafe Latte',             25000, 9000,'Coffee',
    'https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cappuccino',             25000, 9000,'Coffee',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Caramel Macchiato',      30000,11000,'Coffee',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cafe Mocha',             30000,11000,'Coffee',
    'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Tiramisu Latte',         35000,13000,'Coffee',
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Regal Latte',            35000,13000,'Coffee',
    'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cookies Latte',          35000,13000,'Coffee',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Vietnam Coconut Coffee', 30000,11000,'Coffee',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    '[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),

  -- ── ADD ON ────────────────────────────────────────────────────
  ('Syrup',         6000,1500,'Add On',
    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
    '[{"group_name":"Rasa","is_required":true,"options":[{"label":"Vanilla","price_adj":0},{"label":"Caramel","price_adj":0},{"label":"Hazelnut","price_adj":0}]}]'),
  ('Caramel Sauce', 6000,1500,'Add On',
    'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=400&q=80','[]'),
  ('Crumble',       6000,1500,'Add On',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    '[{"group_name":"Rasa","is_required":true,"options":[{"label":"Oreo","price_adj":0},{"label":"Regal","price_adj":0}]}]'),
  ('Espresso Shot', 6000,2000,'Add On',
    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80','[]'),
  ('Oat Milk',     10000,3000,'Add On',
    'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=400&q=80','[]'),

  -- ── SNACK ─────────────────────────────────────────────────────
  ('Mini Kebab Original',    25000, 9000,'Snack',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80','[]'),
  ('Mini Kebab Triple Sauce',27000,10000,'Snack',
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80','[]'),
  ('Butter & Sugar',         20000, 7000,'Snack',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80','[]'),
  ('Choco Crunch',           24000, 8000,'Snack',
    'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=400&q=80','[]'),
  ('Tiramisu Crunch',        24000, 8000,'Snack',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80','[]'),
  ('Kornet Egg Mayo',        28000,10000,'Snack',
    'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&q=80','[]'),

  -- ── FRENCH FRIES ──────────────────────────────────────────────
  ('French Fries', 27000, 9000,'French Fries',
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    '[{"group_name":"Rasa","is_required":true,"options":[{"label":"Sweet Corn","price_adj":0},{"label":"BBQ","price_adj":0},{"label":"Cheese","price_adj":0}]}]'),

  -- ── SARANG IGA ────────────────────────────────────────────────
  ('Iga Bakar Sambal Ijo', 50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Mercon',     50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Sauce BBQ',  50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Kecap Pedas',50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Balado',     50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Sop Iga',              50000,20000,'Sarang Iga',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80','[]'),

  -- ── SPECIAL CHICKEN ───────────────────────────────────────────
  ('Ayam Mercon',    30000,11000,'Special Chicken',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80','[]'),
  ('Ayam Sambal Ijo',30000,11000,'Special Chicken',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80','[]'),
  ('Ayam Balado',    30000,11000,'Special Chicken',
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80','[]'),

  -- ── INDONESIAN TASTE ──────────────────────────────────────────
  ('Nasi Goreng Iga',32000,12000,'Indonesian Taste',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80','[]'),
  ('Mie Goreng Iga', 32000,12000,'Indonesian Taste',
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80','[]'),
  ('Mie Kuah Iga',   32000,12000,'Indonesian Taste',
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80','[]'),

  -- ── JAPANESE KITCHEN ──────────────────────────────────────────
  ('Chicken Namban',           33000,13000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
    '[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Curry Rice', 33000,13000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1604908177453-7462950a8a3b?w=400&q=80',
    '[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Don',        33000,13000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1571167530149-c1105da4c2c8?w=400&q=80',
    '[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Teriyaki',   33000,13000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    '[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Karage',           21000, 8000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80','[]'),
  ('Enoki',            21000, 6000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80','[]'),
  ('Miso Soup',        18000, 5000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80','[]'),
  ('Chicken Skin',     21000, 7000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80','[]'),
  ('Beef Teriyaki',    42000,17000,'Japanese Kitchen',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    '[{"group_name":"Nasi","is_required":false,"options":[{"label":"Dengan Nasi +6k","price_adj":6000}]}]'),

  -- ── DESSERT ───────────────────────────────────────────────────
  ('Caramel Pudding',  18000, 6000,'Dessert',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80','[]'),
  ('Ogura Ice Cream',  12000, 4000,'Dessert',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80','[]'),
  ('Caramel Ice Cream',12000, 4000,'Dessert',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80','[]')
),
menu_with_cat AS (
  SELECT d.mname, d.price, d.cost, c.id AS cat_id, d.img, d.variants::jsonb AS variants
  FROM menu_data d
  JOIN categories c ON c.name = d.cat_name
)
-- UPDATE item yang sudah ada (ambil id terbaru per nama)
UPDATE menu_items mi
SET
  base_price  = mwc.price,
  cost        = mwc.cost,
  category_id = mwc.cat_id,
  image_url   = mwc.img,
  variants    = mwc.variants
FROM menu_with_cat mwc
WHERE mi.name = mwc.mname
  AND mi.id = (
    SELECT id FROM menu_items WHERE name = mwc.mname ORDER BY created_at DESC LIMIT 1
  );

-- INSERT item yang belum ada
WITH menu_data(mname, price, cost, cat_name, img, variants) AS (VALUES
  ('Matcha Latte',    30000,11000,'Non Coffee','https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]},{"group_name":"Gula","is_required":false,"options":[{"label":"Normal","price_adj":0},{"label":"Less Sugar","price_adj":0},{"label":"No Sugar","price_adj":0}]}]'),
  ('Cocoa Latte',     30000,10000,'Non Coffee','https://images.unsplash.com/photo-1605024126085-ba7e43083e5c?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Oreo Latte',      25000, 9000,'Non Coffee','https://images.unsplash.com/photo-1621934051292-4748c2140bd2?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Teh Tarik',       25000, 8000,'Non Coffee','https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Raspberry Tea',   29000, 9000,'Non Coffee','https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80','[]'),
  ('Lychee Tea',      23000, 7000,'Non Coffee','https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&q=80','[]'),
  ('Lemon Tea',       23000, 7000,'Non Coffee','https://images.unsplash.com/photo-1587398692-5e2e34dab1c2?w=400&q=80','[]'),
  ('Teh Poci',        20000, 6000,'Non Coffee','https://images.unsplash.com/photo-1597481499750-3e6b22637536?w=400&q=80','[]'),
  ('Sweet Tea',       15000, 4000,'Non Coffee','https://images.unsplash.com/photo-1597481499750-3e6b22637536?w=400&q=80','[]'),
  ('Wedang Jahe',     17000, 5000,'Non Coffee','https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80','[]'),
  ('Air Mineral',     10000, 2000,'Non Coffee','https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80','[]'),
  ('Matcha Cream',    23000, 8000,'Frappuccino','https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&q=80','[]'),
  ('Taro Frapp',      23000, 8000,'Frappuccino','https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80','[]'),
  ('Coco Caramelly',  23000, 8000,'Frappuccino','https://images.unsplash.com/photo-1615485736973-9ed6d7e29d86?w=400&q=80','[]'),
  ('Caramella Cream', 23000, 8000,'Frappuccino','https://images.unsplash.com/photo-1572490122747-3e92036d0377?w=400&q=80','[]'),
  ('Regal Frapp',     23000, 8000,'Frappuccino','https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=400&q=80','[]'),
  ('Kopi Melamoen',        25000, 9000,'Signature','https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Jakarta Cloud',        27000,10000,'Signature','https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Flaminggo Breeze',     27000,10000,'Signature','https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Black Sunset',         25000, 9000,'Signature','https://images.unsplash.com/photo-1543253687-c931c8e01820?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Beach in the Morning', 25000, 9000,'Signature','https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Kopurma',              25000, 9000,'Signature','https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Aurora Blanc',         35000,13000,'Signature','https://images.unsplash.com/photo-1526743688-2caa2ddc2d05?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Blue Sky',             30000,11000,'Signature','https://images.unsplash.com/photo-1529925130-6b4dc3c6a948?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Sea Salt Caramel Latte', 35000,13000,'Coffee','https://images.unsplash.com/photo-1561882468-9110d70d3339?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Single/Double Espresso', 15000, 5000,'Coffee','https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80','[]'),
  ('Americano / Long Black', 20000, 7000,'Coffee','https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cafe Latte',             25000, 9000,'Coffee','https://images.unsplash.com/photo-1593443320739-77f74939d0da?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cappuccino',             25000, 9000,'Coffee','https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Caramel Macchiato',      30000,11000,'Coffee','https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cafe Mocha',             30000,11000,'Coffee','https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Tiramisu Latte',         35000,13000,'Coffee','https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Regal Latte',            35000,13000,'Coffee','https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Cookies Latte',          35000,13000,'Coffee','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Vietnam Coconut Coffee', 30000,11000,'Coffee','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80','[{"group_name":"Suhu","is_required":true,"options":[{"label":"Ice","price_adj":0},{"label":"Hot","price_adj":0}]}]'),
  ('Syrup',         6000,1500,'Add On','https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80','[{"group_name":"Rasa","is_required":true,"options":[{"label":"Vanilla","price_adj":0},{"label":"Caramel","price_adj":0},{"label":"Hazelnut","price_adj":0}]}]'),
  ('Caramel Sauce', 6000,1500,'Add On','https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?w=400&q=80','[]'),
  ('Crumble',       6000,1500,'Add On','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80','[{"group_name":"Rasa","is_required":true,"options":[{"label":"Oreo","price_adj":0},{"label":"Regal","price_adj":0}]}]'),
  ('Espresso Shot', 6000,2000,'Add On','https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80','[]'),
  ('Oat Milk',     10000,3000,'Add On','https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=400&q=80','[]'),
  ('Mini Kebab Original',    25000, 9000,'Snack','https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80','[]'),
  ('Mini Kebab Triple Sauce',27000,10000,'Snack','https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80','[]'),
  ('Butter & Sugar',         20000, 7000,'Snack','https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80','[]'),
  ('Choco Crunch',           24000, 8000,'Snack','https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=400&q=80','[]'),
  ('Tiramisu Crunch',        24000, 8000,'Snack','https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80','[]'),
  ('Kornet Egg Mayo',        28000,10000,'Snack','https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&q=80','[]'),
  ('French Fries', 27000, 9000,'French Fries','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80','[{"group_name":"Rasa","is_required":true,"options":[{"label":"Sweet Corn","price_adj":0},{"label":"BBQ","price_adj":0},{"label":"Cheese","price_adj":0}]}]'),
  ('Iga Bakar Sambal Ijo', 50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Mercon',     50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Sauce BBQ',  50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Kecap Pedas',50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Iga Bakar Balado',     50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80','[]'),
  ('Sop Iga',              50000,20000,'Sarang Iga','https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80','[]'),
  ('Ayam Mercon',    30000,11000,'Special Chicken','https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80','[]'),
  ('Ayam Sambal Ijo',30000,11000,'Special Chicken','https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80','[]'),
  ('Ayam Balado',    30000,11000,'Special Chicken','https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=400&q=80','[]'),
  ('Nasi Goreng Iga',32000,12000,'Indonesian Taste','https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80','[]'),
  ('Mie Goreng Iga', 32000,12000,'Indonesian Taste','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80','[]'),
  ('Mie Kuah Iga',   32000,12000,'Indonesian Taste','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80','[]'),
  ('Chicken Namban',           33000,13000,'Japanese Kitchen','https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80','[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Curry Rice', 33000,13000,'Japanese Kitchen','https://images.unsplash.com/photo-1604908177453-7462950a8a3b?w=400&q=80','[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Don',        33000,13000,'Japanese Kitchen','https://images.unsplash.com/photo-1571167530149-c1105da4c2c8?w=400&q=80','[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Chicken Katsu Teriyaki',   33000,13000,'Japanese Kitchen','https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80','[{"group_name":"Ukuran","is_required":true,"options":[{"label":"Reguler","price_adj":0},{"label":"Jumbo","price_adj":8000}]}]'),
  ('Karage',           21000, 8000,'Japanese Kitchen','https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80','[]'),
  ('Enoki',            21000, 6000,'Japanese Kitchen','https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80','[]'),
  ('Miso Soup',        18000, 5000,'Japanese Kitchen','https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80','[]'),
  ('Chicken Skin',     21000, 7000,'Japanese Kitchen','https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80','[]'),
  ('Beef Teriyaki',    42000,17000,'Japanese Kitchen','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80','[{"group_name":"Nasi","is_required":false,"options":[{"label":"Dengan Nasi +6k","price_adj":6000}]}]'),
  ('Caramel Pudding',  18000, 6000,'Dessert','https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80','[]'),
  ('Ogura Ice Cream',  12000, 4000,'Dessert','https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80','[]'),
  ('Caramel Ice Cream',12000, 4000,'Dessert','https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80','[]')
),
menu_with_cat AS (
  SELECT d.mname, d.price, d.cost, c.id AS cat_id, d.img, d.variants::jsonb AS variants
  FROM menu_data d
  JOIN categories c ON c.name = d.cat_name
)
INSERT INTO menu_items (name, base_price, cost, category_id, image_url, variants)
SELECT mname, price, cost, cat_id, img, variants
FROM menu_with_cat mwc
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = mwc.mname);

-- 7. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Verifikasi
SELECT c.name AS kategori, COUNT(m.id) AS jumlah
FROM categories c LEFT JOIN menu_items m ON m.category_id = c.id
GROUP BY c.name ORDER BY c.name;
