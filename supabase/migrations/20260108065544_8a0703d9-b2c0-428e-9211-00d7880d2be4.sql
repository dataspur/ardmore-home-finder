-- Add admin roles for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('bradynorman@ymail.com', 'trevor@dataspur.io')
ON CONFLICT (user_id, role) DO NOTHING;