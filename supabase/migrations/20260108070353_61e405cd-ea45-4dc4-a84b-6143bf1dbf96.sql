-- Create admin_messages table
CREATE TABLE public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_mass_message BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_recipients table (tracks who received each message)
CREATE TABLE public.message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.admin_messages(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_messages
CREATE POLICY "Admins can manage all messages"
ON public.admin_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tenants can view messages sent to them
CREATE POLICY "Tenants can view their messages"
ON public.admin_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.message_recipients mr
    JOIN public.tenants t ON t.id = mr.tenant_id
    WHERE mr.message_id = admin_messages.id
    AND t.user_id = auth.uid()
  )
);

-- RLS Policies for message_recipients
CREATE POLICY "Admins can manage all recipients"
ON public.message_recipients FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tenants can view their own message recipients
CREATE POLICY "Tenants can view their own messages"
ON public.message_recipients FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = message_recipients.tenant_id
    AND tenants.user_id = auth.uid()
  )
);

-- Tenants can mark their messages as read
CREATE POLICY "Tenants can update their own message read status"
ON public.message_recipients FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id = message_recipients.tenant_id
    AND tenants.user_id = auth.uid()
  )
);

-- Add updated_at trigger for admin_messages
CREATE TRIGGER update_admin_messages_updated_at
BEFORE UPDATE ON public.admin_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();