-- Add policy for admins to view all form submissions
CREATE POLICY "Admins can view all form submissions"
ON public.form_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to update form submissions (change status)
CREATE POLICY "Admins can update form submissions"
ON public.form_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));