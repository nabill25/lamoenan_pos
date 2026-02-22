-- ======================================================================================
-- LAMOENAN POS - TIER 3
-- MODULE 2: VOID & REFUND TRANSAKSI
-- ======================================================================================

-- 1. Add void/refund columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voided_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS void_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Notify PostgREST
NOTIFY pgrst, 'reload schema';
