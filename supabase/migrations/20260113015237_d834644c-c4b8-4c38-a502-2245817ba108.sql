-- Drop existing hardcoded admin policies
DROP POLICY IF EXISTS "Admins can do everything on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can do everything on leases" ON public.leases;
DROP POLICY IF EXISTS "Admins can do everything on payments" ON public.payments;

-- Note: The correct policies already exist based on the schema:
-- - "Admins can manage all tenants" using has_role()
-- - "Tenants can view their own record" 
-- - "Admins can manage all leases" using has_role()
-- - "Tenants can view their own leases"
-- - "Admins can manage all payments" using has_role()
-- - "Tenants can view their own payments"

-- These policies are already correctly configured, so this migration just cleans up any legacy hardcoded policies