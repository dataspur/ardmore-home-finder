import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lease_id, payment_method_id, customer_id } = await req.json();

    if (!lease_id || !payment_method_id || !customer_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating subscription for lease:", lease_id);

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Fetch lease details
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select("id, rent_amount_cents, property_address, tenant_id, due_date, stripe_price_id")
      .eq("id", lease_id)
      .single();

    if (leaseError || !lease) {
      console.error("Failed to fetch lease:", leaseError);
      return new Response(
        JSON.stringify({ error: "Lease not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });

    // Set as default payment method
    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    // Get or create price for rent
    let priceId = lease.stripe_price_id;

    if (!priceId) {
      // Create a product for this property
      const product = await stripe.products.create({
        name: `Monthly Rent - ${lease.property_address}`,
        metadata: {
          lease_id: lease_id,
        },
      });

      // Create a recurring price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: lease.rent_amount_cents,
        currency: "usd",
        recurring: {
          interval: "month",
        },
        metadata: {
          lease_id: lease_id,
        },
      });

      priceId = price.id;

      // Save price ID to lease
      await supabaseAdmin
        .from("leases")
        .update({ stripe_price_id: priceId })
        .eq("id", lease_id);

      console.log("Created Stripe product and price:", priceId);
    }

    // Calculate billing anchor date (next due date)
    const dueDate = new Date(lease.due_date);
    const now = new Date();
    
    // If due date is in the past, set to next month's due date
    if (dueDate <= now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      items: [{ price: priceId }],
      default_payment_method: payment_method_id,
      billing_cycle_anchor: Math.floor(dueDate.getTime() / 1000),
      proration_behavior: "none",
      metadata: {
        lease_id: lease_id,
        tenant_id: lease.tenant_id,
      },
    });

    console.log("Created subscription:", subscription.id);

    // Update lease with subscription info
    await supabaseAdmin
      .from("leases")
      .update({
        autopay_enabled: true,
        stripe_subscription_id: subscription.id,
        stripe_payment_method_id: payment_method_id,
      })
      .eq("id", lease_id);

    return new Response(
      JSON.stringify({ 
        subscription_id: subscription.id,
        status: subscription.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Create subscription error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
