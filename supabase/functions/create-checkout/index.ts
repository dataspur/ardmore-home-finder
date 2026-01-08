import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lease_id, return_url } = await req.json();

    if (!lease_id || !return_url) {
      throw new Error("Missing required fields: lease_id and return_url");
    }

    console.log("Creating checkout for lease:", lease_id);

    // Initialize Supabase Admin Client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // SECURITY: Fetch rent amount from database, NOT from frontend
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select("rent_amount_cents, property_address, tenant_id")
      .eq("id", lease_id)
      .eq("status", "active")
      .single();

    if (leaseError || !lease) {
      console.error("Lease fetch error:", leaseError);
      throw new Error("Lease not found or inactive");
    }

    console.log("Lease found:", { 
      property: lease.property_address, 
      amount_cents: lease.rent_amount_cents 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "us_bank_account"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rent Payment - ${lease.property_address}`,
            },
            unit_amount: lease.rent_amount_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        lease_id,
        tenant_id: lease.tenant_id,
      },
      success_url: `${return_url}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: return_url,
    });

    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
