-- ======================================================================================
-- LAMOENAN POS - TIER 2 (MOKAPOS LEVEL)
-- MODULE 2: PROMOS & DISCOUNTS
-- ======================================================================================

-- 1. Create promos table
CREATE TABLE IF NOT EXISTS public.promos (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,          -- e.g., 'WEEKEND10', 'MEMBER50K'
    name text NOT NULL,                 -- e.g., 'Diskon Akhir Pekan', 'Potongan Member'
    description text,
    discount_type text NOT NULL,        -- 'percentage' or 'fixed'
    discount_value numeric NOT NULL,    -- 10 (for 10%), 50000 (for Rp50.000)
    min_order_amount numeric DEFAULT 0, -- Minimum spend required to use this promo
    max_discount_amount numeric,        -- Max discount for 'percentage' (e.g., max Rp20.000)
    start_date timestamptz,             -- Nullable if valid indefinitely
    end_date timestamptz,               -- Nullable if valid indefinitely
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT promos_pkey PRIMARY KEY (id)
);

-- 2. Add promo reference to orders table (optional, for tracking)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_id uuid REFERENCES public.promos(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code text;

-- 3. Enable RLS
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for promos
CREATE POLICY "Enable read access for all users" ON public.promos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.promos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.promos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.promos FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
