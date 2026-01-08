import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return new Response("Missing signature", { status: 400 });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    console.log("Received webhook event:", event.type);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const leaseId = session.metadata?.lease_id;
      const tenantId = session.metadata?.tenant_id;
      const amountCents = session.amount_total;
      const stripeSessionId = session.id;

      if (!leaseId || !amountCents) {
        console.error("Missing required metadata:", { leaseId, amountCents });
        return new Response("Missing metadata", { status: 400 });
      }

      console.log("Processing payment:", {
        leaseId,
        tenantId,
        amountCents,
        stripeSessionId,
      });

      // Initialize Supabase Admin Client
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") || "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
      );

      // Insert payment record
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          lease_id: leaseId,
          amount_cents: amountCents,
          status: "paid",
          stripe_session_id: stripeSessionId,
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Failed to insert payment:", paymentError);
        return new Response("Database error", { status: 500 });
      }

      console.log("Payment recorded:", payment.id);

      // Fetch tenant email for confirmation
      if (tenantId) {
        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("email, name")
          .eq("id", tenantId)
          .maybeSingle();

        if (tenant?.email) {
          // Send confirmation email
          try {
            const amountFormatted = (amountCents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });

            await resend.emails.send({
              from: "Precision Capital <onboarding@resend.dev>",
              to: [tenant.email],
              subject: "Payment Receipt - Precision Capital",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #1a1a1a;">Payment Confirmed</h1>
                  <p>Dear ${tenant.name},</p>
                  <p>We have received your rent payment of <strong>${amountFormatted}</strong>.</p>
                  <p>Transaction ID: ${stripeSessionId}</p>
                  <p>Thank you for your prompt payment.</p>
                  <br>
                  <p>Best regards,<br>Precision Capital</p>
                </div>
              `,
            });

            console.log("Confirmation email sent to:", tenant.email);
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
            // Don't fail the webhook if email fails
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
