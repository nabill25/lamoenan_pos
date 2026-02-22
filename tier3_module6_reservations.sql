-- ======================================================================================
-- LAMOENAN POS - TIER 3
-- MODULE 6: TABLE RESERVATIONS
-- ======================================================================================

-- 1. Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    customer_name text NOT NULL,
    customer_phone text,
    table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
    table_name text,                   -- denormalized for display
    pax integer NOT NULL DEFAULT 2,    -- Number of guests
    scheduled_at timestamptz NOT NULL, -- Reservation date & time
    notes text,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'arrived', 'cancelled', 'no_show')),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT reservations_pkey PRIMARY KEY (id)
);

-- 2. Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Enable read access for all users" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.reservations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.reservations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.reservations FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Notify PostgREST
NOTIFY pgrst, 'reload schema';
