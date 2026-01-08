import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  form_type: "maintenance" | "lease" | "contact";
  name: string;
  email: string;
  address?: string;
  issue?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_type, name, email, address, issue, message }: NotificationRequest = await req.json();
    
    console.log("Received notification request:", { form_type, name, email, address });

    // Store contact form submissions in database
    if (form_type === "contact") {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: dbError } = await supabase.from("form_submissions").insert({
          form_type: "contact",
          user_id: null, // Anonymous submission
          data: { name, email, message },
          status: "pending",
        });

        if (dbError) {
          console.error("Failed to store contact submission:", dbError);
        } else {
          console.log("Contact submission stored in database");
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
      }
    }

    let subject: string;
    let htmlContent: string;
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

    if (form_type === "maintenance") {
      subject = `🔧 New Maintenance Request from ${name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Maintenance Request</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Resident Name</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Resident Email</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Property Address</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${address || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Issue Description</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${issue || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Submitted</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${timestamp}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This email was sent from the Precision Capital Resident Portal.</p>
        </div>
      `;
    } else if (form_type === "lease") {
      subject = `📄 Lease Copy Request from ${name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Lease Copy Request</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Resident Name</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Resident Email</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Property Address</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${address || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Submitted</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${timestamp}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This email was sent from the Precision Capital Resident Portal.</p>
        </div>
      `;
    } else {
      subject = `📬 New Contact Form Message from ${name}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Form Message</h2>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Name</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Email</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Message</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${message || "No message provided"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Submitted</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${timestamp}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This email was sent from the Precision Capital website contact form.</p>
        </div>
      `;
    }

    console.log("Sending email to management@precisioncapital.homes");
    
    const emailResponse = await resend.emails.send({
      from: "Precision Capital <noreply@precisioncapital.homes>",
      to: ["management@precisioncapital.homes"],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
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
