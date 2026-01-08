-- Add autopay tracking columns to leases table
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS autopay_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;