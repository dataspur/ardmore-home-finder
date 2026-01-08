-- Add user_id column to tenants table to link authenticated users
ALTER TABLE tenants ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_tenants_user_id ON tenants(user_id);

-- Create function to get tenant lease by user_id
CREATE OR REPLACE FUNCTION get_tenant_lease_by_user(lookup_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'access_token', t.access_token,
    'lease_id', l.id,
    'property_address', l.property_address,
    'tenant_id', t.id
  ) INTO result
  FROM tenants t
  INNER JOIN leases l ON l.tenant_id = t.id
  WHERE t.user_id = lookup_user_id
    AND l.status = 'active'
  LIMIT 1;
  
  RETURN result;
END;
$$;