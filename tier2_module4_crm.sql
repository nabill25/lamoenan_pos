-- ======================================================================================
-- LAMOENAN POS - TIER 2 (MOKAPOS LEVEL)
-- MODULE 4: CRM & MEMBER LOYALTY POINTS
-- ======================================================================================

-- 1. Add points column to members table (if not exists)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- 2. Create point_histories table
CREATE TABLE IF NOT EXISTS public.point_histories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL, -- Nullable if points adjusted manually
    type text NOT NULL CHECK (type IN ('earned', 'redeemed', 'adjustment')),
    points_amount integer NOT NULL,        -- Positive for earned, negative for redeemed
    notes text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT point_histories_pkey PRIMARY KEY (id)
);

-- 3. Modify orders to track if points were redeemed
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_redeemed integer DEFAULT 0;

-- 4. Enable RLS for point histories
ALTER TABLE public.point_histories ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Enable read access for all users" ON public.point_histories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.point_histories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.point_histories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.point_histories FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
