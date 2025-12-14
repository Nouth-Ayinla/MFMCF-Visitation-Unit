-- Add is_approved column with default false
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Add approved_by column (who approved the user)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Add approved_at column (when the user was approved)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Auto-approve existing users who have roles (they're clearly approved)
UPDATE public.profiles 
SET is_approved = true, approved_at = now()
WHERE id IN (SELECT user_id FROM public.user_roles);

-- Update handle_new_user function to set is_approved = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_approved)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    false
  );
  RETURN new;
END;
$$;

-- Drop existing UPDATE policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate the user's own profile update policy
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update all profiles (for approvals)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'visitation_coordinator'::app_role) OR 
  has_role(auth.uid(), 'assistant_coordinator'::app_role)
);

-- Allow admins to delete profiles (for rejections)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  has_role(auth.uid(), 'visitation_coordinator'::app_role) OR 
  has_role(auth.uid(), 'assistant_coordinator'::app_role)
);