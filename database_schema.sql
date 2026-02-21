-- Create table for Ingredient Categories
CREATE TABLE public.ingredient_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT ingredient_categories_pkey PRIMARY KEY (id)
);

-- Create table for Ingredients
CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs'::text,
  min_stock numeric NOT NULL DEFAULT 0,
  current_stock numeric NOT NULL DEFAULT 0,
  category_id uuid NULL,
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT ingredients_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ingredient_categories(id) ON DELETE SET NULL
);

-- Create table for Stock Movements (History)
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL,
  type text NOT NULL, -- 'in', 'out', 'adjustment'
  quantity numeric NOT NULL,
  notes text NULL,
  created_at timestamptz NULL DEFAULT now(),
  created_by uuid NULL, -- References auth.users(id) if auth is used
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) - Optional, depends on project auth setup
ALTER TABLE public.ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (simpler for now, modify based on roles later)
CREATE POLICY "Enable read access for all users" ON public.ingredient_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.ingredient_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.ingredient_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.ingredient_categories FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.ingredients FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.stock_movements FOR UPDATE USING (true);
