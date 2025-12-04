-- Fix the RLS policy to allow super_admins to view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Also add policy for assistant coordinators to view all roles
CREATE POLICY "Assistant coordinators can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));