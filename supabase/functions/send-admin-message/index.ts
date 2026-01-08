import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  subject: string;
  body: string;
  tenant_ids?: string[]; // If not provided, sends to all tenants
  is_mass_message: boolean;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
}

// SECURITY: HTML escape function to prevent XSS in emails
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("User is not an admin");
    }

    const { subject, body, tenant_ids, is_mass_message }: SendMessageRequest = await req.json();

    console.log("Sending admin message:", { subject, is_mass_message, tenant_ids });

    // Get tenants to message
    let tenants: Tenant[] = [];
    
    if (is_mass_message || !tenant_ids || tenant_ids.length === 0) {
      // Get all tenants
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, email");
      
      if (error) throw error;
      tenants = data || [];
    } else {
      // Get specific tenants
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, email")
        .in("id", tenant_ids);
      
      if (error) throw error;
      tenants = data || [];
    }

    if (tenants.length === 0) {
      throw new Error("No tenants found to message");
    }

    console.log(`Found ${tenants.length} tenants to message`);

    // Insert message into admin_messages
    const { data: message, error: msgError } = await supabase
      .from("admin_messages")
      .insert({
        sender_id: user.id,
        subject,
        body,
        is_mass_message,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    console.log("Message created:", message.id);

    // Create recipient records
    const recipientRecords = tenants.map(tenant => ({
      message_id: message.id,
      tenant_id: tenant.id,
    }));

    const { error: recipientError } = await supabase
      .from("message_recipients")
      .insert(recipientRecords);

    if (recipientError) throw recipientError;

    console.log("Recipient records created");

    // SECURITY: Sanitize user input before embedding in HTML emails
    const sanitizedSubject = escapeHtml(subject);
    const sanitizedBody = escapeHtml(body);

    // Send emails to all tenants
    const emailPromises = tenants.map(tenant => 
      resend.emails.send({
        from: "Precision Capital Management <onboarding@resend.dev>",
        to: [tenant.email],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Precision Capital Management</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #1e3a5f; margin-top: 0;">${sanitizedSubject}</h2>
              <div style="border-left: 4px solid #1e3a5f; padding-left: 20px; margin: 20px 0;">
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${sanitizedBody}</p>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Log in to your <a href="https://precisioncapital.homes/resident-portal" style="color: #1e3a5f;">Resident Portal</a> to view this message and more.
              </p>
            </div>
            <div style="background-color: #eee; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              Precision Capital Management | (580) 399-0001
            </div>
          </div>
        `,
      }).catch(err => {
        console.error(`Failed to send email to ${tenant.email}:`, err);
        return null;
      })
    );

    const emailResults = await Promise.all(emailPromises);
    const successfulEmails = emailResults.filter(r => r !== null).length;

    console.log(`Emails sent: ${successfulEmails}/${tenants.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: message.id,
        recipients: tenants.length,
        emails_sent: successfulEmails
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" || error.message === "User is not an admin" ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
