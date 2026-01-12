-- Create lease_documents table
CREATE TABLE public.lease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.lease_documents ENABLE ROW LEVEL SECURITY;

-- Admin can manage all documents
CREATE POLICY "Admins can manage lease documents"
  ON public.lease_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Tenants can view their own documents
CREATE POLICY "Tenants can view their own documents"
  ON public.lease_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE tenants.id = lease_documents.tenant_id
        AND tenants.user_id = auth.uid()
    )
  );

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lease-documents', 'lease-documents', false);

-- Admin can upload lease documents
CREATE POLICY "Admins can upload lease documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lease-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all lease documents
CREATE POLICY "Admins can view all lease documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lease-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete lease documents
CREATE POLICY "Admins can delete lease documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lease-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Tenants can download their own documents
CREATE POLICY "Tenants can view their own lease documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lease-documents' AND
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.lease_documents ld ON ld.tenant_id = t.id
      WHERE t.user_id = auth.uid()
        AND ld.file_path = name
    )
  );