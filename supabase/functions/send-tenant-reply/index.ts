import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyRequest {
  message_id: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-tenant-reply function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { message_id, body }: ReplyRequest = await req.json();

    if (!message_id || !body) {
      throw new Error("message_id and body are required");
    }

    console.log("Processing reply from user:", user.id);

    // Get tenant info for the user
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, email")
      .eq("user_id", user.id)
      .single();

    if (tenantError || !tenant) {
      throw new Error("Tenant not found for this user");
    }

    // Verify the tenant has access to this message
    const { data: recipient, error: recipientError } = await supabase
      .from("message_recipients")
      .select("id, admin_messages(subject)")
      .eq("message_id", message_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (recipientError || !recipient) {
      throw new Error("Message not found or access denied");
    }

    // Insert the reply
    const { error: replyError } = await supabase
      .from("message_replies")
      .insert({
        message_id,
        tenant_id: tenant.id,
        body,
      });

    if (replyError) {
      console.error("Reply insert error:", replyError);
      throw new Error("Failed to save reply");
    }

    // Get the message subject for the email
    const messageSubject = (recipient.admin_messages as any)?.subject || "Message";

    // Send email notification to admin
    console.log("Sending reply notification to management");
    const emailResponse = await resend.emails.send({
      from: "Precision Capital <noreply@precisioncapital.homes>",
      to: ["management@precisioncapital.homes"],
      subject: `💬 Reply from ${tenant.name}: Re: ${messageSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Tenant Reply Received
          </h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">From</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${tenant.name} (${tenant.email})</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Regarding</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${messageSubject}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Reply</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${body}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            View and respond in the <a href="https://precisioncapital.homes/admin/messages">Admin Dashboard</a>.
          </p>
        </div>
      `,
    });

    console.log("Reply notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-tenant-reply function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
