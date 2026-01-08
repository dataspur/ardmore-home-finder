import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_type, name, email, address, issue }: NotificationRequest = await req.json();
    
    console.log("Received notification request:", { form_type, name, email, address });

    let subject: string;
    let htmlContent: string;
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

    if (form_type === "maintenance") {
      subject = `New Maintenance Request from ${name}`;
      htmlContent = `
        <h2>New Maintenance Request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resident Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resident Email</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Property Address</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${address || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Issue Description</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${issue || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Submitted</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${timestamp}</td>
          </tr>
        </table>
      `;
    } else if (form_type === "lease") {
      subject = `Lease Copy Request from ${name}`;
      htmlContent = `
        <h2>Lease Copy Request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resident Name</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resident Email</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Property Address</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${address || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Submitted</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${timestamp}</td>
          </tr>
        </table>
      `;
    } else {
      subject = `Contact Form Submission from ${name}`;
      htmlContent = `
        <h2>Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Submitted:</strong> ${timestamp}</p>
      `;
    }

    console.log("Sending email to management@precisioncapital.homes");
    
    const emailResponse = await resend.emails.send({
      from: "Precision Capital <onboarding@resend.dev>",
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
