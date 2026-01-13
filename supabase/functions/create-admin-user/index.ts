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

    // Try to create the new admin user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    let userId: string;
    let isExistingUser = false;

    if (createError) {
      // Check if user already exists - if so, promote them to admin
      if (createError.message.includes("already been registered")) {
        // Find the existing user by email
        const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }

        const existingUser = usersData.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "User exists but could not be found. Please try again." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user is already an admin
        const { data: existingRole } = await adminClient
          .from("user_roles")
          .select("id")
          .eq("user_id", existingUser.id)
          .eq("role", "admin")
          .single();

        if (existingRole) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "User is already an admin",
              user_id: existingUser.id 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = existingUser.id;
        isExistingUser = true;
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
    }

    // Assign admin role to the user
    const { error: roleInsertError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "admin",
      });

    if (roleInsertError) {
      // Rollback: only delete user if we just created them
      if (!isExistingUser) {
        await adminClient.auth.admin.deleteUser(userId);
      }
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

    const message = isExistingUser 
      ? "Existing user promoted to admin. They can log in with their existing password."
      : "Admin user created successfully";

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        user_id: userId 
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
