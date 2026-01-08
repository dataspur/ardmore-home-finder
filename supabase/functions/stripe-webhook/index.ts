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

// Enhanced email template
const createPaymentReceiptEmail = (
  tenantName: string,
  amountFormatted: string,
  propertyAddress: string,
  transactionId: string,
  paymentMethod: string,
  paymentDate: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Precision Capital</h1>
      <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px;">Property Management</p>
    </div>
    
    <!-- Success Badge -->
    <div style="text-align: center; padding: 24px 24px 0 24px;">
      <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
        ✓ Payment Successful
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Dear ${tenantName},</p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">Thank you for your rent payment. Your transaction has been processed successfully.</p>
      
      <!-- Payment Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Payment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid</td>
            <td style="padding: 8px 0; color: #1a365d; font-size: 14px; font-weight: 600; text-align: right;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${paymentDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Transaction ID</td>
            <td style="padding: 8px 0; color: #374151; font-size: 12px; text-align: right; font-family: monospace;">${transactionId.slice(0, 20)}...</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin: 0;">Please keep this email as your receipt for your records.</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-align: center;">Questions about your payment?</p>
      <p style="margin: 0; text-align: center;">
        <a href="mailto:management@precisioncapital.homes" style="color: #1a365d; font-size: 14px; text-decoration: none;">management@precisioncapital.homes</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0 0; text-align: center;">© ${new Date().getFullYear()} Precision Capital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Autopay enrollment confirmation email
const createAutopayEnrollmentEmail = (
  tenantName: string,
  propertyAddress: string,
  rentAmount: string,
  nextPaymentDate: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Precision Capital</h1>
      <p style="color: #cbd5e1; margin: 8px 0 0 0; font-size: 14px;">Property Management</p>
    </div>
    
    <!-- Success Badge -->
    <div style="text-align: center; padding: 24px 24px 0 24px;">
      <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
        🔄 Autopay Activated
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Dear ${tenantName},</p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">Great news! Your automatic payment has been set up successfully. You're all set for hassle-free rent payments.</p>
      
      <!-- Autopay Details Card -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">Autopay Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Monthly Amount</td>
            <td style="padding: 8px 0; color: #1e40af; font-size: 14px; font-weight: 600; text-align: right;">${rentAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Next Payment</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${nextPaymentDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">Bank Account (ACH)</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin: 0;">Your bank account will be automatically charged on your due date each month. You'll receive a confirmation email after each payment.</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-align: center;">Need to cancel or modify autopay?</p>
      <p style="margin: 0; text-align: center;">
        <a href="mailto:management@precisioncapital.homes" style="color: #1a365d; font-size: 14px; text-decoration: none;">Contact us at management@precisioncapital.homes</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0 0; text-align: center;">© ${new Date().getFullYear()} Precision Capital. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

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

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Handle checkout.session.completed (one-time payments)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Check if this is a setup session (autopay) or payment session
      if (session.mode === "setup") {
        console.log("Setup session completed, processing autopay enrollment");
        
        const leaseId = session.metadata?.lease_id;
        const tenantId = session.metadata?.tenant_id;
        const rentAmountCents = session.metadata?.rent_amount_cents;
        const setupIntentId = session.setup_intent as string;

        if (!leaseId || !tenantId || !setupIntentId) {
          console.error("Missing setup metadata");
          return new Response("Missing metadata", { status: 400 });
        }

        // Retrieve the setup intent to get the payment method
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        const paymentMethodId = setupIntent.payment_method as string;
        const customerId = session.customer as string;

        if (!paymentMethodId) {
          console.error("No payment method from setup intent");
          return new Response("No payment method", { status: 400 });
        }

        console.log("Creating subscription with payment method:", paymentMethodId);

        // Call create-subscription function internally
        // Get or create price for rent
        const { data: lease } = await supabaseAdmin
          .from("leases")
          .select("id, rent_amount_cents, property_address, due_date, stripe_price_id")
          .eq("id", leaseId)
          .single();

        if (!lease) {
          console.error("Lease not found for subscription");
          return new Response("Lease not found", { status: 404 });
        }

        let priceId = lease.stripe_price_id;

        if (!priceId) {
          // Create a product for this property
          const product = await stripe.products.create({
            name: `Monthly Rent - ${lease.property_address}`,
            metadata: { lease_id: leaseId },
          });

          // Create a recurring price
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: lease.rent_amount_cents,
            currency: "usd",
            recurring: { interval: "month" },
            metadata: { lease_id: leaseId },
          });

          priceId = price.id;

          await supabaseAdmin
            .from("leases")
            .update({ stripe_price_id: priceId })
            .eq("id", leaseId);
        }

        // Calculate billing anchor
        const dueDate = new Date(lease.due_date);
        const now = new Date();
        if (dueDate <= now) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId,
          billing_cycle_anchor: Math.floor(dueDate.getTime() / 1000),
          proration_behavior: "none",
          metadata: {
            lease_id: leaseId,
            tenant_id: tenantId,
          },
        });

        console.log("Created subscription:", subscription.id);

        // Update lease with autopay info
        await supabaseAdmin
          .from("leases")
          .update({
            autopay_enabled: true,
            stripe_subscription_id: subscription.id,
            stripe_payment_method_id: paymentMethodId,
          })
          .eq("id", leaseId);

        // Send autopay confirmation email
        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("email, name")
          .eq("id", tenantId)
          .maybeSingle();

        if (tenant?.email) {
          try {
            const rentFormatted = (lease.rent_amount_cents / 100).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });

            await resend.emails.send({
              from: "Precision Capital <onboarding@resend.dev>",
              to: [tenant.email],
              subject: "Autopay Activated - Precision Capital",
              html: createAutopayEnrollmentEmail(
                tenant.name,
                lease.property_address,
                rentFormatted,
                dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              ),
            });

            console.log("Autopay confirmation email sent to:", tenant.email);
          } catch (emailError) {
            console.error("Failed to send autopay email:", emailError);
          }
        }
      } else {
        // Regular payment session
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

        // Get lease info for email
        const { data: lease } = await supabaseAdmin
          .from("leases")
          .select("property_address")
          .eq("id", leaseId)
          .maybeSingle();

        // Fetch tenant email for confirmation
        if (tenantId) {
          const { data: tenant } = await supabaseAdmin
            .from("tenants")
            .select("email, name")
            .eq("id", tenantId)
            .maybeSingle();

          if (tenant?.email) {
            try {
              const amountFormatted = (amountCents / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              });

              // Determine payment method from session
              const paymentMethod = session.payment_method_types?.includes("us_bank_account")
                ? "Bank Account (ACH)"
                : "Card";

              await resend.emails.send({
                from: "Precision Capital <onboarding@resend.dev>",
                to: [tenant.email],
                subject: "Payment Receipt - Precision Capital",
                html: createPaymentReceiptEmail(
                  tenant.name,
                  amountFormatted,
                  lease?.property_address || "Your Property",
                  stripeSessionId,
                  paymentMethod,
                  new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                ),
              });

              console.log("Confirmation email sent to:", tenant.email);
            } catch (emailError) {
              console.error("Failed to send email:", emailError);
            }
          }
        }
      }
    }

    // Handle invoice.payment_succeeded (subscription payments)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        const leaseId = invoice.subscription_details?.metadata?.lease_id || invoice.metadata?.lease_id;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id || invoice.metadata?.tenant_id;
        const amountCents = invoice.amount_paid;

        if (leaseId && amountCents) {
          console.log("Processing subscription payment:", { leaseId, amountCents });

          // Insert payment record
          const { error: paymentError } = await supabaseAdmin
            .from("payments")
            .insert({
              lease_id: leaseId,
              amount_cents: amountCents,
              status: "paid",
              stripe_session_id: invoice.id,
            });

          if (paymentError) {
            console.error("Failed to insert subscription payment:", paymentError);
          } else {
            console.log("Subscription payment recorded");

            // Get lease and tenant for email
            const { data: lease } = await supabaseAdmin
              .from("leases")
              .select("property_address")
              .eq("id", leaseId)
              .maybeSingle();

            if (tenantId) {
              const { data: tenant } = await supabaseAdmin
                .from("tenants")
                .select("email, name")
                .eq("id", tenantId)
                .maybeSingle();

              if (tenant?.email) {
                try {
                  const amountFormatted = (amountCents / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  });

                  await resend.emails.send({
                    from: "Precision Capital <onboarding@resend.dev>",
                    to: [tenant.email],
                    subject: "Autopay Payment Receipt - Precision Capital",
                    html: createPaymentReceiptEmail(
                      tenant.name,
                      amountFormatted,
                      lease?.property_address || "Your Property",
                      invoice.id,
                      "Bank Account (ACH) - Autopay",
                      new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    ),
                  });

                  console.log("Subscription payment email sent to:", tenant.email);
                } catch (emailError) {
                  console.error("Failed to send subscription email:", emailError);
                }
              }
            }
          }
        }
      }
    }

    // Handle invoice.payment_failed (failed subscription payments)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        const leaseId = invoice.subscription_details?.metadata?.lease_id || invoice.metadata?.lease_id;
        const tenantId = invoice.subscription_details?.metadata?.tenant_id || invoice.metadata?.tenant_id;

        console.log("Subscription payment failed:", { leaseId, tenantId });

        if (tenantId) {
          const { data: tenant } = await supabaseAdmin
            .from("tenants")
            .select("email, name")
            .eq("id", tenantId)
            .maybeSingle();

          if (tenant?.email) {
            try {
              const amountFormatted = ((invoice.amount_due || 0) / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              });

              await resend.emails.send({
                from: "Precision Capital <onboarding@resend.dev>",
                to: [tenant.email],
                subject: "⚠️ Autopay Payment Failed - Action Required",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%); padding: 24px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0;">Precision Capital</h1>
                    </div>
                    <div style="padding: 24px; background-color: #fef2f2; border: 1px solid #fecaca;">
                      <h2 style="color: #991b1b; margin: 0 0 16px 0;">Payment Failed</h2>
                      <p style="color: #374151;">Dear ${tenant.name},</p>
                      <p style="color: #374151;">We were unable to process your autopay rent payment of <strong>${amountFormatted}</strong>.</p>
                      <p style="color: #374151;">Please update your payment method or make a manual payment to avoid late fees.</p>
                      <p style="color: #374151; margin-top: 24px;">If you have any questions, please contact us at <a href="mailto:management@precisioncapital.homes">management@precisioncapital.homes</a>.</p>
                    </div>
                  </div>
                `,
              });

              console.log("Payment failed email sent to:", tenant.email);
            } catch (emailError) {
              console.error("Failed to send payment failed email:", emailError);
            }
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
