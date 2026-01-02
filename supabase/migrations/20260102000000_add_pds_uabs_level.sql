-- Add PDS/UABS level option
INSERT INTO public.levels (level_number) VALUES
  ('PDS/UABS')
ON CONFLICT (level_number) DO NOTHING;
