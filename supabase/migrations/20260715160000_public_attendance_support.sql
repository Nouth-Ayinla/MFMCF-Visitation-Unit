-- Make marked_by in attendance nullable to support public/self marking
ALTER TABLE public.attendance ALTER COLUMN marked_by DROP NOT NULL;

-- Make performed_by in attendance_audit nullable to support public/self marking
ALTER TABLE public.attendance_audit ALTER COLUMN performed_by DROP NOT NULL;

-- Create RPC function to safely search members without exposing sensitive data publicly
CREATE OR REPLACE FUNCTION public.search_members_public(p_search_query TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  level_number TEXT,
  department_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.full_name,
    l.level_number,
    d.name as department_name
  FROM public.members m
  LEFT JOIN public.levels l ON m.level_id = l.id
  LEFT JOIN public.departments d ON m.department_id = d.id
  WHERE 
    m.full_name ILIKE '%' || p_search_query || '%'
    OR m.phone_number ILIKE '%' || p_search_query || '%'
  ORDER BY m.full_name
  LIMIT 20;
END;
$$;

-- Create RPC function to safely mark self/public attendance
CREATE OR REPLACE FUNCTION public.mark_self_attendance(
  p_member_id UUID,
  p_service_type text,
  p_attendance_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_id UUID;
  v_result JSONB;
BEGIN
  -- Insert into attendance
  INSERT INTO public.attendance (member_id, service_type, attendance_date, marked_by)
  VALUES (p_member_id, p_service_type::public.service_type, p_attendance_date, NULL)
  ON CONFLICT (member_id, attendance_date) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    -- Attendance already marked for this date
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Attendance already marked for this service today'
    );
  END IF;

  -- Create audit record
  INSERT INTO public.attendance_audit (attendance_id, action, performed_by, new_data)
  VALUES (
    v_inserted_id,
    'created',
    NULL,
    jsonb_build_object(
      'id', v_inserted_id,
      'member_id', p_member_id,
      'attendance_date', p_attendance_date,
      'marked_by', NULL,
      'service_type', p_service_type
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'attendance_id', v_inserted_id
  );
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
