import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyRequest {
  submission_id: string;
  reply: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("reply-to-submission function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role from auth header
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
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { submission_id, reply }: ReplyRequest = await req.json();

    if (!submission_id || !reply) {
      throw new Error("submission_id and reply are required");
    }

    console.log("Processing reply for submission:", submission_id);

    // Get the submission details
    const { data: submission, error: subError } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (subError || !submission) {
      throw new Error("Submission not found");
    }

    const submissionData = submission.data as Record<string, any>;
    const recipientEmail = submissionData.email;
    const recipientName = submissionData.name || submissionData.fullName || "Valued Customer";

    if (!recipientEmail) {
      throw new Error("No email address found in submission");
    }

    // Update the submission with admin reply
    const { error: updateError } = await supabase
      .from("form_submissions")
      .update({
        admin_reply: reply,
        admin_reply_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", submission_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to save reply");
    }

    // Send email to the submitter
    console.log("Sending reply email to:", recipientEmail);
    const emailResponse = await resend.emails.send({
      from: "Precision Capital <management@precisioncapital.homes>",
      to: [recipientEmail],
      subject: `Re: Your ${submission.form_type} inquiry`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Response from Precision Capital
          </h2>
          <p>Hello ${recipientName},</p>
          <p>Thank you for reaching out to us. Here is our response to your inquiry:</p>
          <div style="background: #f3f4f6; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="white-space: pre-wrap; margin: 0;">${reply}</p>
          </div>
          <p>If you have any further questions, please don't hesitate to contact us:</p>
          <ul>
            <li>Phone: (580) 399-0001</li>
            <li>Email: management@precisioncapital.homes</li>
          </ul>
          <p>Best regards,<br>Precision Capital Team</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This email was sent in response to your ${submission.form_type} submission.
          </p>
        </div>
      `,
    });

    console.log("Reply email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in reply-to-submission function:", error);
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
