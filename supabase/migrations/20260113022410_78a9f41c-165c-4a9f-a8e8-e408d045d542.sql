-- Create admin_invitations table to track admin invitations
CREATE TABLE public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked'))
);

-- Create unique index on email for pending invitations only
CREATE UNIQUE INDEX admin_invitations_email_pending_idx 
ON public.admin_invitations (email) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "Admins can manage invitations"
ON public.admin_invitations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));