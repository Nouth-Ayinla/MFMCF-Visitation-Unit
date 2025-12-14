import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationRequest {
  fullName: string;
  phoneNumber: string;
  address?: string;
  dateOfBirth: string;
  gender?: string;
  levelId: string;
  departmentId: string;
  departmentOther?: string;
  howDidYouHear?: string;
  isFirstTimer: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const registrationData: RegistrationRequest = await req.json();
    console.log('Processing registration:', { 
      name: registrationData.fullName, 
      phone: registrationData.phoneNumber,
      departmentId: registrationData.departmentId,
      departmentOther: registrationData.departmentOther
    });

    // Validate required fields
    if (!registrationData.fullName || !registrationData.phoneNumber || 
        !registrationData.dateOfBirth || !registrationData.levelId || 
        !registrationData.departmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate phone number
    if (registrationData.phoneNumber) {
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('phone_number', registrationData.phoneNumber)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Phone number already registered' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let finalDepartmentId = registrationData.departmentId;

    // If user selected "other" and provided a custom department name
    if (registrationData.departmentId === 'other' && registrationData.departmentOther) {
      const departmentName = registrationData.departmentOther.trim();
      console.log('Checking for existing department:', departmentName);

      // Check if department already exists (case-insensitive)
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id, name')
        .ilike('name', departmentName)
        .maybeSingle();

      if (existingDept) {
        console.log('Department already exists:', existingDept);
        finalDepartmentId = existingDept.id;
      } else {
        // Create new department
        console.log('Creating new department:', departmentName);
        const { data: newDept, error: deptError } = await supabase
          .from('departments')
          .insert({ name: departmentName })
          .select('id')
          .single();

        if (deptError) {
          console.error('Error creating department:', deptError);
          return new Response(
            JSON.stringify({ error: 'Failed to create department', details: deptError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('New department created:', newDept);
        finalDepartmentId = newDept.id;
      }
    }

    // Insert member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        full_name: registrationData.fullName.trim(),
        phone_number: registrationData.phoneNumber.trim().replace(/\s+/g, ''),
        address: registrationData.address?.trim() || null,
        date_of_birth: registrationData.dateOfBirth,
        gender: registrationData.gender || null,
        level_id: registrationData.levelId,
        department_id: finalDepartmentId === 'other' ? null : finalDepartmentId,
        department_other: finalDepartmentId === 'other' ? registrationData.departmentOther : null,
        how_did_you_hear: registrationData.howDidYouHear?.trim() || null,
        is_first_timer: registrationData.isFirstTimer,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error creating member:', memberError);
      return new Response(
        JSON.stringify({ error: 'Failed to register member', details: memberError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Member registered successfully:', member.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration successful',
        memberId: member.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in register-member function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
