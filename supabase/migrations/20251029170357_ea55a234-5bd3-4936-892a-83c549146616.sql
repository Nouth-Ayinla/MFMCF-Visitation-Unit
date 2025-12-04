-- Add RLS policies to allow admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Assistant coordinators can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));