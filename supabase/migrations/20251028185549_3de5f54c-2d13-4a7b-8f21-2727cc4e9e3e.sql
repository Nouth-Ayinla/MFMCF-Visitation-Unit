-- Drop existing policies and recreate them to ensure they're correct
DO $$ 
BEGIN
  -- Drop and recreate departments policies
  DROP POLICY IF EXISTS "Everyone can view departments" ON public.departments;
  DROP POLICY IF EXISTS "Super admins can manage departments" ON public.departments;
  
  CREATE POLICY "Everyone can view departments"
    ON public.departments FOR SELECT
    USING (true);
  
  CREATE POLICY "Super admins can manage departments"
    ON public.departments FOR ALL
    USING (has_role(auth.uid(), 'super_admin'::app_role));
  
  -- Drop and recreate levels policies
  DROP POLICY IF EXISTS "Everyone can view levels" ON public.levels;
  DROP POLICY IF EXISTS "Super admins can manage levels" ON public.levels;
  
  CREATE POLICY "Everyone can view levels"
    ON public.levels FOR SELECT
    USING (true);
  
  CREATE POLICY "Super admins can manage levels"
    ON public.levels FOR ALL
    USING (has_role(auth.uid(), 'super_admin'::app_role));
END $$;

-- RLS Policies for members
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can insert members (first-timer registration)" ON public.members;
  DROP POLICY IF EXISTS "Super admins can view all members" ON public.members;
  DROP POLICY IF EXISTS "Assistant coordinators can view all members" ON public.members;
  DROP POLICY IF EXISTS "Presidents can view all members" ON public.members;
  DROP POLICY IF EXISTS "Centrals can view all members" ON public.members;
  DROP POLICY IF EXISTS "Level coordinators can view their assigned members" ON public.members;
  DROP POLICY IF EXISTS "Super admins can update all members" ON public.members;
  DROP POLICY IF EXISTS "Assistant coordinators can update all members" ON public.members;
  DROP POLICY IF EXISTS "Level coordinators can update their assigned members" ON public.members;
  DROP POLICY IF EXISTS "Super admins can delete members" ON public.members;

  CREATE POLICY "Anyone can insert members (first-timer registration)"
    ON public.members FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Super admins can view all members"
    ON public.members FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'::app_role));

  CREATE POLICY "Assistant coordinators can view all members"
    ON public.members FOR SELECT
    USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));

  CREATE POLICY "Presidents can view all members"
    ON public.members FOR SELECT
    USING (has_role(auth.uid(), 'president'::app_role));

  CREATE POLICY "Centrals can view all members"
    ON public.members FOR SELECT
    USING (has_role(auth.uid(), 'central'::app_role));

  CREATE POLICY "Level coordinators can view their assigned members"
    ON public.members FOR SELECT
    USING (
      has_role(auth.uid(), 'level_coordinator'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (assigned_department_id = members.department_id OR assigned_department_id IS NULL)
          AND (assigned_level_id = members.level_id OR assigned_level_id IS NULL)
      )
    );

  CREATE POLICY "Super admins can update all members"
    ON public.members FOR UPDATE
    USING (has_role(auth.uid(), 'super_admin'::app_role));

  CREATE POLICY "Assistant coordinators can update all members"
    ON public.members FOR UPDATE
    USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));

  CREATE POLICY "Level coordinators can update their assigned members"
    ON public.members FOR UPDATE
    USING (
      has_role(auth.uid(), 'level_coordinator'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND (assigned_department_id = members.department_id OR assigned_department_id IS NULL)
          AND (assigned_level_id = members.level_id OR assigned_level_id IS NULL)
      )
    );

  CREATE POLICY "Super admins can delete members"
    ON public.members FOR DELETE
    USING (has_role(auth.uid(), 'super_admin'::app_role));
END $$;

-- RLS Policies for attendance
DO $$
BEGIN
  DROP POLICY IF EXISTS "Super admins can view all attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Assistant coordinators can view all attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Presidents can view all attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Centrals can view all attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Level coordinators can view attendance for their members" ON public.attendance;
  DROP POLICY IF EXISTS "Super admins can mark attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Assistant coordinators can mark attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Level coordinators can mark attendance for their members" ON public.attendance;
  DROP POLICY IF EXISTS "Super admins can update attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Assistant coordinators can update attendance" ON public.attendance;
  DROP POLICY IF EXISTS "Super admins can delete attendance" ON public.attendance;

  CREATE POLICY "Super admins can view all attendance"
    ON public.attendance FOR SELECT
    USING (has_role(auth.uid(), 'super_admin'::app_role));

  CREATE POLICY "Assistant coordinators can view all attendance"
    ON public.attendance FOR SELECT
    USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));

  CREATE POLICY "Presidents can view all attendance"
    ON public.attendance FOR SELECT
    USING (has_role(auth.uid(), 'president'::app_role));

  CREATE POLICY "Centrals can view all attendance"
    ON public.attendance FOR SELECT
    USING (has_role(auth.uid(), 'central'::app_role));

  CREATE POLICY "Level coordinators can view attendance for their members"
    ON public.attendance FOR SELECT
    USING (
      has_role(auth.uid(), 'level_coordinator'::app_role) AND
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
    WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

  CREATE POLICY "Assistant coordinators can mark attendance"
    ON public.attendance FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'assistant_coordinator'::app_role));

  CREATE POLICY "Level coordinators can mark attendance for their members"
    ON public.attendance FOR INSERT
    WITH CHECK (
      has_role(auth.uid(), 'level_coordinator'::app_role) AND
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
    USING (has_role(auth.uid(), 'super_admin'::app_role));

  CREATE POLICY "Assistant coordinators can update attendance"
    ON public.attendance FOR UPDATE
    USING (has_role(auth.uid(), 'assistant_coordinator'::app_role));

  CREATE POLICY "Super admins can delete attendance"
    ON public.attendance FOR DELETE
    USING (has_role(auth.uid(), 'super_admin'::app_role));
END $$;