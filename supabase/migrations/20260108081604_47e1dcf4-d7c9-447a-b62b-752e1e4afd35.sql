-- Create message_replies table for tenant replies
CREATE TABLE public.message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.admin_messages(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  is_read_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- RLS: Tenants can create replies to their messages
CREATE POLICY "Tenants can create replies to their messages"
ON public.message_replies FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = message_replies.tenant_id
    AND tenants.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.message_recipients mr
    JOIN public.tenants t ON t.id = mr.tenant_id
    WHERE mr.message_id = message_replies.message_id
    AND t.user_id = auth.uid()
  )
);

-- RLS: Tenants can view replies on their messages
CREATE POLICY "Tenants can view replies on their messages"
ON public.message_replies FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.message_recipients mr
    JOIN public.tenants t ON t.id = mr.tenant_id
    WHERE mr.message_id = message_replies.message_id
    AND t.user_id = auth.uid()
  )
);

-- RLS: Admins can view all replies
CREATE POLICY "Admins can view all replies"
ON public.message_replies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update replies (mark as read)
CREATE POLICY "Admins can update replies"
ON public.message_replies FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for message_recipients and message_replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_replies;

-- Make user_id nullable in form_submissions for anonymous contact form submissions
ALTER TABLE public.form_submissions ALTER COLUMN user_id DROP NOT NULL;

-- Add admin_reply column to form_submissions for reply history
ALTER TABLE public.form_submissions ADD COLUMN admin_reply TEXT;
ALTER TABLE public.form_submissions ADD COLUMN admin_reply_at TIMESTAMPTZ;

-- Update RLS policy to allow service role inserts for contact form
CREATE POLICY "Allow anonymous contact submissions"
ON public.form_submissions FOR INSERT
WITH CHECK (form_type = 'contact' AND user_id IS NULL);