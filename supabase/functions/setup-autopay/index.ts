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
    // SECURITY: Validate access token from request
    const { lease_id, return_url, access_token } = await req.json();

    if (!lease_id || !return_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Setting up autopay for lease:", lease_id);

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Fetch lease details
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select("id, rent_amount_cents, property_address, tenant_id")
      .eq("id", lease_id)
      .single();

    if (leaseError || !lease) {
      console.error("Failed to fetch lease:", leaseError);
      return new Response(
        JSON.stringify({ error: "Lease not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tenant separately with access_token for verification
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name, email, stripe_customer_id, access_token")
      .eq("id", lease.tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error("Failed to fetch tenant:", tenantError);
      return new Response(
        JSON.stringify({ error: "Tenant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate access token matches (for token-based access like /pay/:token)
    if (access_token && tenant.access_token !== access_token) {
      console.error("Access token mismatch");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no access token provided, require Authorization header
    if (!access_token) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Missing authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabaseAdmin.auth.getUser(token);
      
      if (claimsError || !claims.user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer
    let customerId = tenant.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: {
          tenant_id: tenant.id,
          lease_id: lease_id,
        },
      });
      customerId = customer.id;

      // Save customer ID to tenant record
      await supabaseAdmin
        .from("tenants")
        .update({ stripe_customer_id: customerId })
        .eq("id", tenant.id);

      console.log("Created Stripe customer:", customerId);
    }

    // Create Checkout Session in setup mode for bank account
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      payment_method_types: ["us_bank_account"],
      customer: customerId,
      setup_intent_data: {
        metadata: {
          lease_id: lease_id,
          tenant_id: tenant.id,
        },
      },
      success_url: `${return_url}?autopay=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?autopay=cancelled`,
      metadata: {
        lease_id: lease_id,
        tenant_id: tenant.id,
        rent_amount_cents: lease.rent_amount_cents.toString(),
      },
    });

    console.log("Created setup session:", session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Setup autopay error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
