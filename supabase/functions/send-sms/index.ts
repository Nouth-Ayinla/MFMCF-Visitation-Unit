// SMS sending via eBulkSMS API - Updated 2025-11-30
// @ts-expect-error: remote import resolved in Deno runtime used by Supabase
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-expect-error: remote import resolved in Deno runtime used by Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

// Minimal `Deno` declaration for the editor/tsserver so `Deno.env.get` is recognized
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmsRequest {
  phoneNumber: string;
  message: string;
  memberId: string;
}

/**
 * Formats phone number for eBulkSMS API
 * Converts Nigerian local format (0XXXXXXXXXX) to eBulkSMS format (234XXXXXXXXXX)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any whitespace and simple separators
  const cleaned = phoneNumber.replace(/[()\s-]/g, '');
  
  // If the number already starts with 234, return as is
  if (cleaned.startsWith('234')) {
    return cleaned;
  }
  
  // If the number starts with + and then 234, remove the +
  if (cleaned.startsWith('+234')) {
    return cleaned.substring(1);
  }
  
  // If the number starts with 0 (Nigerian local format), replace with 234
  if (cleaned.startsWith('0')) {
    return '234' + cleaned.substring(1);
  }
  
  // If none of the above, assume it's a Nigerian number without 0, add 234
  return '234' + cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Invalid authentication:', authError);
      
      // Check if it's specifically a session missing error
      if (authError?.name === 'AuthSessionMissingError' || authError?.message?.includes('Auth session missing')) {
        return new Response(
          JSON.stringify({ 
            error: 'Session expired. Please log in again.',
            code: 'SESSION_EXPIRED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role authorization
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Authorization check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allowedRoles = ['visitation_coordinator', 'assistant_coordinator', 'level_coordinator'];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      console.error('User does not have permission to send SMS:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to send SMS' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get eBulkSMS credentials from environment
    const username = Deno.env.get('EBULKSMS_USERNAME');
    const apiKey = Deno.env.get('EBULKSMS_API_KEY');
    const senderId = Deno.env.get('EBULKSMS_SENDER_ID') || 'MFMCF';

    // Log masked credentials for debugging
    console.info('eBulkSMS credentials check:', {
      username: username ? `${username.substring(0, 4)}...${username.substring(username.length - 4)}` : 'NOT SET',
      apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET',
      senderId: senderId,
      usernameLength: username?.length || 0,
      apiKeyLength: apiKey?.length || 0
    });

    if (!username || !apiKey) {
      console.error('Missing eBulkSMS environment variables');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate credential format
    if (username.length < 5) {
      console.error('Invalid username format: too short');
      return new Response(
        JSON.stringify({ error: 'SMS service misconfigured (invalid username)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (apiKey.length < 20) {
      console.error('Invalid API key format: too short');
      return new Response(
        JSON.stringify({ error: 'SMS service misconfigured (invalid API key)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { phoneNumber, message, memberId }: SmsRequest = await req.json();

    if (!phoneNumber || !message || !memberId) {
      console.error('Missing required fields:', { phoneNumber, message, memberId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phoneNumber, message, or memberId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message length
    if (message.length > 1600) {
      return new Response(
        JSON.stringify({ error: 'Message exceeds 1600 character limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate message content - detect suspicious patterns
    const suspiciousPatterns = [
      /http[s]?:\/\/(?!.*\.(gov|edu))[^\s]+/gi, // URLs except .gov/.edu
      /bit\.ly|tinyurl|goo\.gl/gi, // URL shorteners
      /click here|verify account|urgent action|act now/gi, // Phishing phrases
      /password|credit card|bank account|ssn/gi, // Sensitive info requests
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        console.warn('Suspicious content detected in message:', { userId: user.id, pattern: pattern.source });
        return new Response(
          JSON.stringify({ error: 'Message contains potentially unsafe content. Please review and try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify member exists and user has permission to contact them
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError || !member) {
      console.error('Member not found or access denied:', memberId);
      return new Response(
        JSON.stringify({ error: 'Member not found or you do not have permission to contact them' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check - max 10 SMS per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentSmsCount, error: countError } = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .gte('last_sms_sent_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    } else if (recentSmsCount && recentSmsCount >= 10) {
      console.warn('Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 SMS per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for eBulkSMS API
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    console.log(`Original phone number: ${phoneNumber}`);
    console.log(`Formatted phone number: ${formattedPhoneNumber}`);
    console.log(`Attempting to send SMS to ${formattedPhoneNumber}`);

    // Send SMS via eBulkSMS API
    const smsPayload = {
      SMS: {
        auth: {
          username: username,
          apikey: apiKey,
        },
        message: {
          sender: senderId,
          messagetext: message,
          flash: "0",
        },
        recipients: {
          gsm: [
            {
              msidn: formattedPhoneNumber,
              msgid: `sms_${Date.now()}`,
            },
          ],
        },
      },
    };

    console.log("Sending SMS via eBulkSMS...");

    const response = await fetch("https://api.ebulksms.com/sendsms.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    if (!response.ok) {
      console.error("eBulkSMS HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
    }

    const result = await response.json();
    console.log("eBulkSMS response:", result);

    if (result.response?.status === "SUCCESS") {
      console.log('SMS sent successfully by user:', user.id, 'to member:', memberId);

      // Update member record with last SMS sent timestamp (use service role for this)
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabaseService
        .from('members')
        .update({ last_sms_sent_at: new Date().toISOString() })
        .eq('id', memberId);

      if (updateError) {
        console.error('Error updating member record:', updateError);
        // Don't fail the request if update fails - SMS was still sent
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS sent successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const apiStatus = result.response?.status || 'Unknown error';
      console.error('eBulkSMS API error:', result);
      
      // Provide specific error messages based on status
      let errorMessage = 'Failed to send SMS';
      if (apiStatus === 'AUTH_FAILURE') {
        errorMessage = 'SMS authentication failed. Please verify your eBulkSMS credentials in the Supabase dashboard.';
        console.error('AUTH_FAILURE: Verify EBULKSMS_USERNAME (login email), EBULKSMS_API_KEY, and EBULKSMS_SENDER_ID are correct in Supabase secrets');
      } else if (apiStatus === 'INSUFFICIENT_CREDIT') {
        errorMessage = 'Insufficient SMS credits. Please top up your eBulkSMS account.';
      } else if (apiStatus === 'INVALID_SENDER') {
        errorMessage = 'Invalid sender ID. Please verify your eBulkSMS sender ID.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: apiStatus
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
