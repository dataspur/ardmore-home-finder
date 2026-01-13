import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header to verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with the caller's token to verify they're an admin
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is an admin using the service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
      _user_id: callerUser.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can create new admin users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await adminClient
      .from("admin_invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "An invitation for this email is already pending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the new admin user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (createError) {
      // Check if user already exists
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "A user with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    // Assign admin role to the new user
    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "admin",
      });

    if (roleInsertError) {
      // Rollback: delete the created user if role assignment fails
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      throw roleInsertError;
    }

    // Record the invitation
    const { error: inviteError } = await adminClient
      .from("admin_invitations")
      .insert({
        email,
        invited_by: callerUser.id,
        status: "accepted", // Since we're creating the user directly, mark as accepted
        accepted_at: new Date().toISOString(),
      });

    if (inviteError) {
      console.error("Failed to record invitation:", inviteError);
      // Don't fail the whole operation for this
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created successfully",
        user_id: newUser.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error creating admin user:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
