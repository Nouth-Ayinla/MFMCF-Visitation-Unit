-- Create attendance_audit table for tracking changes
CREATE TABLE IF NOT EXISTS public.attendance_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id uuid REFERENCES public.attendance(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  performed_by uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can view audit logs"
  ON public.attendance_audit FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Assistant coordinators can view audit logs"
  ON public.attendance_audit FOR SELECT
  USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.attendance_audit FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attendance_audit_attendance_id ON public.attendance_audit(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_created_at ON public.attendance_audit(created_at DESC);

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

-- RLS Policies
CREATE POLICY "Everyone can view settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage settings"
  ON public.system_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('fellowship_name', '"MFM Campus Fellowship - FUTA Chapter"', 'The name of the fellowship'),
  ('contact_email', '"info@mfmfuta.org"', 'Contact email address'),
  ('attendance_reminder_enabled', 'true', 'Enable/disable attendance reminders'),
  ('first_timer_follow_up_days', '7', 'Days before follow-up reminder for first-timers')
ON CONFLICT (setting_key) DO NOTHING;