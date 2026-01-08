-- Create admin RLS policies for tenants table
CREATE POLICY "Admins can do everything on tenants"
ON public.tenants
FOR ALL
USING (auth.email() = 'management@precisioncapital.homes')
WITH CHECK (auth.email() = 'management@precisioncapital.homes');

-- Create admin RLS policies for leases table
CREATE POLICY "Admins can do everything on leases"
ON public.leases
FOR ALL
USING (auth.email() = 'management@precisioncapital.homes')
WITH CHECK (auth.email() = 'management@precisioncapital.homes');

-- Create admin RLS policies for payments table
CREATE POLICY "Admins can do everything on payments"
ON public.payments
FOR ALL
USING (auth.email() = 'management@precisioncapital.homes')
WITH CHECK (auth.email() = 'management@precisioncapital.homes');