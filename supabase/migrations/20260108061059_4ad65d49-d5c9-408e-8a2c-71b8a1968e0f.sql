-- Update get_lease_details function to include autopay_enabled
CREATE OR REPLACE FUNCTION public.get_lease_details(lookup_token uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  late_fee_cents INTEGER := 0;
  days_diff INTEGER;
BEGIN
  -- First get the lease to calculate late fee
  SELECT 
    CASE 
      WHEN l.due_date < CURRENT_DATE THEN 7500 -- $75 late fee
      ELSE 0 
    END,
    CURRENT_DATE - l.due_date
  INTO late_fee_cents, days_diff
  FROM tenants t
  INNER JOIN leases l ON l.tenant_id = t.id
  WHERE t.access_token = lookup_token
    AND l.status = 'active'
  LIMIT 1;

  -- Build the full result
  SELECT json_build_object(
    'tenant_name', t.name,
    'tenant_email', t.email,
    'property_address', l.property_address,
    'rent_amount_cents', l.rent_amount_cents,
    'late_fee_cents', COALESCE(late_fee_cents, 0),
    'total_due_cents', l.rent_amount_cents + COALESCE(late_fee_cents, 0),
    'due_date', l.due_date,
    'days_until_due', -days_diff,
    'is_past_due', l.due_date < CURRENT_DATE,
    'lease_id', l.id,
    'tenant_id', t.id,
    'lease_start_date', l.created_at::date,
    'autopay_enabled', COALESCE(l.autopay_enabled, false),
    'last_payment', (
      SELECT json_build_object(
        'amount_cents', p.amount_cents,
        'paid_at', p.created_at,
        'status', p.status
      )
      FROM payments p
      WHERE p.lease_id = l.id AND p.status = 'completed'
      ORDER BY p.created_at DESC
      LIMIT 1
    )
  ) INTO result
  FROM tenants t
  INNER JOIN leases l ON l.tenant_id = t.id
  WHERE t.access_token = lookup_token
    AND l.status = 'active'
  LIMIT 1;
  
  RETURN result;
END;
$function$;