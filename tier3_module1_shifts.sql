-- ======================================================================================
-- LAMOENAN POS - TIER 3
-- MODULE 1: SHIFT MANAGEMENT
-- ======================================================================================

-- 1. Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cashier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    cashier_name text,
    opening_cash numeric NOT NULL DEFAULT 0,  -- Modal awal kas saat buka shift
    closing_cash numeric,                      -- Kas aktual saat tutup shift (dihitung kasir)
    expected_cash numeric,                     -- Kas yang seharusnya (dari transaksi)
    total_sales numeric DEFAULT 0,            -- Total penjualan selama shift
    total_orders integer DEFAULT 0,           -- Jumlah transaksi selama shift
    notes text,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    CONSTRAINT shifts_pkey PRIMARY KEY (id)
);

-- 2. Add shift reference to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Enable read access for all users" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.shifts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.shifts FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Notify PostgREST
NOTIFY pgrst, 'reload schema';
