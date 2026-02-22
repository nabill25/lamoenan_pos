-- ======================================================================================
-- LAMOENAN POS - TIER 2 (MOKAPOS LEVEL)
-- MODULE 5: MASTER PAYMENT METHODS
-- ======================================================================================

-- 1. Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,     -- e.g., 'CASH', 'QRIS', 'BCA TRANSFER', 'EDC MANDIRI'
    type text NOT NULL CHECK (type IN ('cash', 'qris', 'transfer', 'edc', 'other')),
    fee_percentage numeric DEFAULT 0, -- e.g., 0.007 for 0.7% MDR QRIS (optional feature)
    fee_fixed numeric DEFAULT 0,      -- e.g., 4000 for transfer fee (optional feature)
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,     -- for UI ordering
    created_at timestamptz DEFAULT now(),
    CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);

-- 2. Insert default payment methods
INSERT INTO public.payment_methods (name, type, sort_order)
VALUES 
    ('CASH', 'cash', 1),
    ('QRIS', 'qris', 2),
    ('MANDIRI TRANSFER', 'transfer', 3),
    ('BCA TRANSFER', 'transfer', 4),
    ('EDC BCA', 'edc', 5)
ON CONFLICT (name) DO NOTHING;

-- 3. Update orders table to use the string representation or ID (Optional: we keep payment_type as text for backward compatibility, but can link by ID if needed. For now, we will just use the payment method Name as text to keep it simple and backwards compatible with existing reports)
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Enable read access for all users" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.payment_methods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.payment_methods FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.payment_methods FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
