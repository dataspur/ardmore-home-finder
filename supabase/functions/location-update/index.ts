import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface PropertyUpdatePayload {
  type: "property_update";
  property_id: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface UserEventPayload {
  type: "user_event";
  event: string;
  coordinates: { lat: number; lng: number };
  properties_shown?: number;
}

type LocationUpdatePayload = PropertyUpdatePayload | UserEventPayload;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: LocationUpdatePayload = await req.json();

    // Validate payload
    if (!payload.type) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (payload.type === "property_update") {
      // Validate API key for property updates (security)
      const apiKey = req.headers.get("x-api-key");
      const expectedKey = Deno.env.get("LOCATION_API_KEY");
      
      if (!expectedKey || apiKey !== expectedKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate coordinates
      if (
        typeof payload.latitude !== "number" ||
        typeof payload.longitude !== "number" ||
        payload.latitude < -90 ||
        payload.latitude > 90 ||
        payload.longitude < -180 ||
        payload.longitude > 180
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid coordinates" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update property location
      const updateData: Record<string, unknown> = {
        latitude: payload.latitude,
        longitude: payload.longitude,
      };

      if (payload.address) {
        updateData.address = payload.address;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", payload.property_id);

      if (error) {
        console.error("Error updating property:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update property" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Property location updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.type === "user_event") {
      // Log user location event for analytics (no auth required)
      console.log("Location event:", {
        event: payload.event,
        coordinates: payload.coordinates,
        properties_shown: payload.properties_shown,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, message: "Event logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid payload type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
