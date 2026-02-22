-- ======================================================================================
-- LAMOENAN POS - TIER 2 (MOKAPOS LEVEL)
-- MODULE 3: DYNAMIC TAXES & SERVICE CHARGE
-- ======================================================================================

-- 1. Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id integer PRIMARY KEY DEFAULT 1, -- Only one row is needed
    tax_rate numeric DEFAULT 0.11,     -- e.g., 0.11 for 11% (PB1)
    service_charge_rate numeric DEFAULT 0.00, -- e.g., 0.05 for 5% service charge
    store_name text DEFAULT 'Lamoenan Cafe & Bistro',
    store_address text,
    store_phone text,
    updated_at timestamptz DEFAULT now(),
    -- Ensure only one row exists
    CONSTRAINT store_settings_single_row CHECK (id = 1)
);

-- 2. Insert default settings if not exists
INSERT INTO public.store_settings (id, tax_rate, service_charge_rate, store_name)
VALUES (1, 0.11, 0, 'Lamoenan Cafe & Bistro')
ON CONFLICT (id) DO NOTHING;

-- 3. Modify orders table to record the applied tax and service charge (for historical accuracy)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_charge_amount numeric DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Enable read access for all users" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users" ON public.store_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.store_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
