import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthdaySMSRequest {
  phone_number: string;
  member_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, member_name }: BirthdaySMSRequest = await req.json();

    console.log(`Sending birthday SMS to ${member_name} at ${phone_number}`);

    if (!phone_number || !member_name) {
      return new Response(
        JSON.stringify({ error: "Phone number and member name are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove leading zero and add country code if needed)
    let formattedPhone = phone_number.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '234' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('234')) {
      formattedPhone = '234' + formattedPhone;
    }

    // Get eBulkSMS credentials from environment
    const username = Deno.env.get('EBULKSMS_USERNAME');
    const apiKey = Deno.env.get('EBULKSMS_API_KEY');
    const senderId = Deno.env.get('EBULKSMS_SENDER_ID') || 'MFMCF';

    if (!username || !apiKey) {
      console.error("eBulkSMS credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Birthday message template
    const firstName = member_name.split(' ')[0];
    const message = `🎂 Happy Birthday ${firstName}! 🎉\n\nThe MFMCF family wishes you a blessed and joyful birthday. May God's grace and blessings be with you today and always!\n\n- MFMCF FUTA`;

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
              msidn: formattedPhone,
              msgid: `bday_${Date.now()}`,
            },
          ],
        },
      },
    };

    console.log("Sending birthday SMS via eBulkSMS...");

    const response = await fetch("https://api.ebulksms.com:8080/sendsms.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    });

    const result = await response.json();
    console.log("eBulkSMS response:", result);

    if (result.response?.status === "SUCCESS") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Birthday SMS sent successfully",
          recipient: member_name,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error("eBulkSMS error:", result);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send SMS", 
          details: result 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in send-birthday-sms function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
