-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can manage settings" ON public.system_settings;

-- RLS Policies
CREATE POLICY "Everyone can view settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('fellowship_name', '"MFM Campus Fellowship - FUTA Chapter"', 'The name of the fellowship'),
  ('contact_email', '"info@mfmfuta.org"', 'Contact email address'),
  ('attendance_reminder_enabled', 'true', 'Enable/disable attendance reminders'),
  ('first_timer_follow_up_days', '7', 'Days before follow-up reminder for first-timers')
ON CONFLICT (setting_key) DO NOTHING;