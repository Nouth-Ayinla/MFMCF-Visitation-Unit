-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create levels table
CREATE TABLE IF NOT EXISTS public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create members table (enhanced version of registrations)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  department_id UUID REFERENCES public.departments(id),
  department_other TEXT,
  level_id UUID REFERENCES public.levels(id),
  how_did_you_hear TEXT,
  is_first_timer BOOLEAN DEFAULT true,
  promoted_to_member_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL,
  marked_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, attendance_date)
);

-- Add assigned department and level to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS assigned_department_id UUID REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS assigned_level_id UUID REFERENCES public.levels(id);

-- Insert all FUTA departments
INSERT INTO public.departments (name) VALUES
  ('AGRIC EXTENSION & COMMUNICATION TECHNOLOGY'),
  ('AGRICULTURAL ENGINEERING'),
  ('AGRICULTURE RESOURCE ECONOMICS'),
  ('ANIMAL PRODUCTION & HEALTH SERVICES'),
  ('APPLIED GEOLOGY'),
  ('APPLIED GEOPHYSICS'),
  ('ARCHITECTURE'),
  ('BIOCHEMISTRY'),
  ('BIOLOGY'),
  ('BIOMEDICAL TECHNOLOGY'),
  ('BIOTECHNOLOGY'),
  ('BUILDING'),
  ('CIVIL ENGINEERING'),
  ('COMPUTER ENGINEERING'),
  ('COMPUTER SCIENCE'),
  ('CROP SOIL & PEST MANAGEMENT'),
  ('CYBER SECURITY'),
  ('ECOTOURISM & WILDLIFE MANAGEMENT'),
  ('ELECTRICAL /ELECTRONICS ENGINEERING'),
  ('ESTATE MANAGEMENT'),
  ('FISHERIES & AQUACULTURE'),
  ('FOOD SCIENCE & TECHNOLOGY'),
  ('FORESTRY & WOOD TECHNOLOGY'),
  ('HUMAN ANATOMY'),
  ('INDUSTRIAL & PRODUCTION ENGINEERING'),
  ('INDUSTRIAL CHEMISTRY'),
  ('INDUSTRIAL DESIGN'),
  ('INDUSTRIAL MATHEMATICS'),
  ('INFORMATION & COMMUNICATION TECHNOLOGY'),
  ('INFORMATION SYSTEMS'),
  ('INFORMATION TECHNOLOGY'),
  ('MARINE SCIENCE & TECHNOLOGY'),
  ('MATHEMATICS'),
  ('MECHANICAL ENGINEERING'),
  ('METALLURGICAL & MATERIALS ENGINEERING'),
  ('METEOROLOGY'),
  ('MICROBIOLOGY'),
  ('MINING ENGINEERING'),
  ('PHYSICS'),
  ('PHYSIOLOGY'),
  ('QUANTITY SURVEYING'),
  ('REMOTE SENSING & GEOSCIENCES INFORMATION SYSTEM'),
  ('SOFTWARE ENGINEERING'),
  ('STATISTICS'),
  ('SURVEYING & GEOINFORMATICS'),
  ('URBAN & REGIONAL PLANNING')
ON CONFLICT (name) DO NOTHING;

-- Insert levels
INSERT INTO public.levels (level_number) VALUES
  ('100'),
  ('200'),
  ('300'),
  ('400'),
  ('500')
ON CONFLICT (level_number) DO NOTHING;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments (read-only for all authenticated users)
CREATE POLICY "Everyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage departments"
  ON public.departments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for levels (read-only for all authenticated users)
CREATE POLICY "Everyone can view levels"
  ON public.levels FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage levels"
  ON public.levels FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for members
CREATE POLICY "Anyone can insert members (first-timer registration)"
  ON public.members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view all members"
  ON public.members FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assistant coordinators can view all members"
  ON public.members FOR SELECT
  USING (has_role(auth.uid(), 'assistant_coordinator'));

CREATE POLICY "Presidents can view all members"
  ON public.members FOR SELECT
  USING (has_role(auth.uid(), 'president'));

CREATE POLICY "Centrals can view all members"
  ON public.members FOR SELECT
  USING (has_role(auth.uid(), 'central'));

CREATE POLICY "Level coordinators can view their assigned members"
  ON public.members FOR SELECT
  USING (
    has_role(auth.uid(), 'level_coordinator') AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND (assigned_department_id = members.department_id OR assigned_department_id IS NULL)
        AND (assigned_level_id = members.level_id OR assigned_level_id IS NULL)
    )
  );

CREATE POLICY "Super admins can update all members"
  ON public.members FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assistant coordinators can update all members"
  ON public.members FOR UPDATE
  USING (has_role(auth.uid(), 'assistant_coordinator'));

CREATE POLICY "Level coordinators can update their assigned members"
  ON public.members FOR UPDATE
  USING (
    has_role(auth.uid(), 'level_coordinator') AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND (assigned_department_id = members.department_id OR assigned_department_id IS NULL)
        AND (assigned_level_id = members.level_id OR assigned_level_id IS NULL)
    )
  );

CREATE POLICY "Super admins can delete members"
  ON public.members FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for attendance
CREATE POLICY "Super admins can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assistant coordinators can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'assistant_coordinator'));

CREATE POLICY "Presidents can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'president'));

CREATE POLICY "Centrals can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'central'));

CREATE POLICY "Level coordinators can view attendance for their members"
  ON public.attendance FOR SELECT
  USING (
    has_role(auth.uid(), 'level_coordinator') AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.members m ON m.id = attendance.member_id
      WHERE ur.user_id = auth.uid()
        AND (ur.assigned_department_id = m.department_id OR ur.assigned_department_id IS NULL)
        AND (ur.assigned_level_id = m.level_id OR ur.assigned_level_id IS NULL)
    )
  );

CREATE POLICY "Super admins can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assistant coordinators can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'assistant_coordinator'));

CREATE POLICY "Level coordinators can mark attendance for their members"
  ON public.attendance FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'level_coordinator') AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.members m ON m.id = attendance.member_id
      WHERE ur.user_id = auth.uid()
        AND (ur.assigned_department_id = m.department_id OR ur.assigned_department_id IS NULL)
        AND (ur.assigned_level_id = m.level_id OR ur.assigned_level_id IS NULL)
    )
  );

CREATE POLICY "Super admins can update attendance"
  ON public.attendance FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assistant coordinators can update attendance"
  ON public.attendance FOR UPDATE
  USING (has_role(auth.uid(), 'assistant_coordinator'));

CREATE POLICY "Super admins can delete attendance"
  ON public.attendance FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_department ON public.members(department_id);
CREATE INDEX IF NOT EXISTS idx_members_level ON public.members(level_id);
CREATE INDEX IF NOT EXISTS idx_members_is_first_timer ON public.members(is_first_timer);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone_number);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned ON public.user_roles(assigned_department_id, assigned_level_id);

-- Create trigger for updated_at on members
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();