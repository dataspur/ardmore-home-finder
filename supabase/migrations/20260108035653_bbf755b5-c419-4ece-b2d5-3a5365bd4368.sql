-- Drop existing policies
DROP POLICY IF EXISTS "Admins can do everything on tenants" ON public.tenants;
DROP POLICY IF EXISTS "Admins can do everything on leases" ON public.leases;
DROP POLICY IF EXISTS "Admins can do everything on payments" ON public.payments;

-- Recreate with correct email
CREATE POLICY "Admins can do everything on tenants" ON public.tenants
  FOR ALL USING (auth.email() = 'bradynorman@ymail.com')
  WITH CHECK (auth.email() = 'bradynorman@ymail.com');

CREATE POLICY "Admins can do everything on leases" ON public.leases
  FOR ALL USING (auth.email() = 'bradynorman@ymail.com')
  WITH CHECK (auth.email() = 'bradynorman@ymail.com');

CREATE POLICY "Admins can do everything on payments" ON public.payments
  FOR ALL USING (auth.email() = 'bradynorman@ymail.com')
  WITH CHECK (auth.email() = 'bradynorman@ymail.com');