-- ======================================================================================
-- LAMOENAN POS - TIER 2 (MOKAPOS LEVEL)
-- MODULE 1: INVENTORY & RECIPES (BILL OF MATERIALS)
-- ======================================================================================

-- 1. Add cost_per_unit to ingredients (if not exists)
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS cost_per_unit numeric NOT NULL DEFAULT 0;

-- 2. Create menu_item_ingredients table (Junction table linking menu_items and ingredients)
CREATE TABLE IF NOT EXISTS public.menu_item_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  quantity_required numeric NOT NULL,
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT menu_item_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT menu_item_ingredients_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE,
  CONSTRAINT menu_item_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE,
  -- Ensure a single ingredient is only added once per menu item
  CONSTRAINT unique_menu_item_ingredient UNIQUE(menu_item_id, ingredient_id)
);

-- 3. Enable RLS
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for menu_item_ingredients
CREATE POLICY "Enable read access for all users" ON public.menu_item_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.menu_item_ingredients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.menu_item_ingredients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.menu_item_ingredients FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
