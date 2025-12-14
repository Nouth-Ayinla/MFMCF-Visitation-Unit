-- Add follow-up tracking columns to members table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'members' 
                 AND column_name = 'contacted_at') THEN
    ALTER TABLE public.members ADD COLUMN contacted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'members' 
                 AND column_name = 'contacted_by') THEN
    ALTER TABLE public.members ADD COLUMN contacted_by UUID REFERENCES public.profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'members' 
                 AND column_name = 'follow_up_notes') THEN
    ALTER TABLE public.members ADD COLUMN follow_up_notes TEXT;
  END IF;
END $$;

-- Create index for contacted_at for sorting (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_members_contacted_at') THEN
    CREATE INDEX idx_members_contacted_at ON public.members(contacted_at);
  END IF;
END $$;