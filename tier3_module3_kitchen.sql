-- ======================================================================================
-- LAMOENAN POS - TIER 3
-- MODULE 3: KITCHEN DISPLAY SYSTEM (KDS)
-- ======================================================================================

-- 1. Add kitchen_status column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'pending' 
  CHECK (kitchen_status IN ('pending', 'cooking', 'ready', 'served'));

-- 2. Notify PostgREST
NOTIFY pgrst, 'reload schema';
