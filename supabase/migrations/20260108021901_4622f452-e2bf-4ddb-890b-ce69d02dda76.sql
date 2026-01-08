-- 1. Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  access_token UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (no public policies - access via RPC only)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create leases table  
CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_address TEXT NOT NULL,
  rent_amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (no public policies)
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

-- 3. Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (no public policies)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 4. Create SECURITY DEFINER function for secure data access
CREATE OR REPLACE FUNCTION public.get_lease_details(lookup_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tenant_name', t.name,
    'property_address', l.property_address,
    'rent_amount_cents', l.rent_amount_cents,
    'due_date', l.due_date,
    'lease_id', l.id,
    'tenant_id', t.id
  ) INTO result
  FROM tenants t
  INNER JOIN leases l ON l.tenant_id = t.id
  WHERE t.access_token = lookup_token
    AND l.status = 'active'
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- 5. Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Seed data (John Doe with $1,500 rent = 150000 cents)
INSERT INTO public.tenants (id, name, email, access_token)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'John Doe',
  'johndoe@example.com',
  'a1b2c3d4-1234-5678-90ab-cdef12345678'
);

INSERT INTO public.leases (tenant_id, property_address, rent_amount_cents, due_date, status)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '123 Main Street, Apt 4B, Oklahoma City, OK 73102',
  150000,
  '2025-02-01',
  'active'
);