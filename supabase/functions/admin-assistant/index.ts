import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const systemPrompt = `You are an AI assistant for a property management admin dashboard called "Control Tower". You help admins manage their real estate business efficiently.

You have access to the following database tables and can perform operations on them:

**Tables:**
1. **tenants** - Tenant information
   - id (uuid), name (text), email (text), access_token (text), created_at (timestamp)

2. **properties** - Property listings (rentals and sales)
   - id (uuid), title (text), address (text), price_cents (integer), bedrooms (integer), 
   - bathrooms (numeric), square_feet (integer), property_type ('rental' | 'sale'), 
   - is_featured (boolean), image_url (text), features (text[]), created_at (timestamp)

3. **managed_properties** - Properties under management
   - id (uuid), address (text), total_units (integer), notes (text), created_at (timestamp)

4. **leases** - Lease agreements
   - id (uuid), tenant_id (uuid), property_address (text), rent_amount_cents (integer),
   - due_date (date), status ('active' | 'expired' | 'terminated'), start_date (date), 
   - end_date (date), created_at (timestamp)

5. **payments** - Rent payments
   - id (uuid), lease_id (uuid), amount_cents (integer), payment_date (timestamp),
   - status ('pending' | 'completed' | 'failed'), stripe_session_id (text)

6. **form_submissions** - Contact form and inquiry submissions
   - id (uuid), form_type ('contact' | 'property_inquiry'), name (text), email (text),
   - message (text), status ('new' | 'read' | 'replied'), created_at (timestamp)

**Guidelines:**
- Always confirm before performing DELETE operations by asking the user to confirm
- When creating records, provide a summary of what was created
- For monetary values, the database stores cents (multiply dollars by 100)
- Property types are either 'rental' or 'sale'
- Lease status can be 'active', 'expired', or 'terminated'
- Payment status can be 'pending', 'completed', or 'failed'
- Be helpful and proactive - suggest related actions after completing tasks
- Format currency as dollars for display (e.g., $1,500.00)
- When listing data, format it nicely with relevant details

**Example responses:**
- "I've added the new tenant John Smith (john@email.com). Would you like me to create a lease for them?"
- "Here's a summary of this month's revenue: $24,500 collected from 15 payments. 3 payments are still pending."
- "I found 2 vacant rental properties: 123 Main St ($1,800/mo) and 456 Oak Ave ($2,200/mo)."`;

const tools = [
  {
    type: "function",
    function: {
      name: "manage_tenants",
      description: "Add, edit, delete, or list tenants in the system",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "get"] },
          tenant_id: { type: "string", description: "UUID of tenant (required for update/delete/get)" },
          name: { type: "string", description: "Tenant's full name" },
          email: { type: "string", description: "Tenant's email address" },
          filters: { 
            type: "object", 
            description: "Filters for list action",
            properties: {
              search: { type: "string", description: "Search by name or email" }
            }
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manage_properties",
      description: "Add, edit, delete, or list property listings (rentals and sales)",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "get"] },
          property_id: { type: "string", description: "UUID of property (required for update/delete/get)" },
          title: { type: "string" },
          address: { type: "string" },
          price_cents: { type: "integer", description: "Price in cents" },
          bedrooms: { type: "integer" },
          bathrooms: { type: "number" },
          square_feet: { type: "integer" },
          property_type: { type: "string", enum: ["rental", "sale"] },
          is_featured: { type: "boolean" },
          image_url: { type: "string" },
          features: { type: "array", items: { type: "string" } },
          filters: {
            type: "object",
            properties: {
              property_type: { type: "string", enum: ["rental", "sale"] },
              is_featured: { type: "boolean" }
            }
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manage_managed_properties",
      description: "Add, edit, delete, or list managed properties",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "get"] },
          property_id: { type: "string", description: "UUID of managed property" },
          address: { type: "string" },
          total_units: { type: "integer" },
          notes: { type: "string" }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manage_leases",
      description: "Create, update, or list lease agreements",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete", "list", "get"] },
          lease_id: { type: "string" },
          tenant_id: { type: "string" },
          property_address: { type: "string" },
          rent_amount_cents: { type: "integer" },
          due_date: { type: "string", description: "Date in YYYY-MM-DD format" },
          status: { type: "string", enum: ["active", "expired", "terminated"] },
          start_date: { type: "string" },
          end_date: { type: "string" },
          filters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["active", "expired", "terminated"] },
              tenant_id: { type: "string" }
            }
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manage_payments",
      description: "Record, update, or list payments",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "list", "get"] },
          payment_id: { type: "string" },
          lease_id: { type: "string" },
          amount_cents: { type: "integer" },
          status: { type: "string", enum: ["pending", "completed", "failed"] },
          filters: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["pending", "completed", "failed"] },
              lease_id: { type: "string" }
            }
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "Get summary statistics for the dashboard including revenue, pending rent, active leases, and occupancy",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "this_week", "this_month", "this_year", "all_time"], description: "Time period for stats" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_all",
      description: "Search across all data including tenants, properties, leases, and submissions",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" }
        },
        required: ["query"]
      }
    }
  }
];

async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "manage_tenants": {
        const { action, tenant_id, name: tenantName, email, filters } = args;
        
        if (action === "list") {
          let query = supabase.from("tenants").select("*");
          if (filters && typeof filters === "object" && "search" in filters) {
            const search = (filters as { search: string }).search;
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
          }
          const { data, error } = await query.order("created_at", { ascending: false });
          if (error) throw error;
          return JSON.stringify({ success: true, data, count: data?.length || 0 });
        }
        
        if (action === "get") {
          const { data, error } = await supabase.from("tenants").select("*").eq("id", tenant_id).single();
          if (error) throw error;
          return JSON.stringify({ success: true, data });
        }
        
        if (action === "create") {
          const accessToken = crypto.randomUUID();
          const { data, error } = await supabase.from("tenants").insert({
            name: tenantName,
            email,
            access_token: accessToken
          }).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: `Tenant "${tenantName}" created successfully` });
        }
        
        if (action === "update") {
          const updates: Record<string, unknown> = {};
          if (tenantName) updates.name = tenantName;
          if (email) updates.email = email;
          const { data, error } = await supabase.from("tenants").update(updates).eq("id", tenant_id).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Tenant updated successfully" });
        }
        
        if (action === "delete") {
          const { error } = await supabase.from("tenants").delete().eq("id", tenant_id);
          if (error) throw error;
          return JSON.stringify({ success: true, message: "Tenant deleted successfully" });
        }
        
        return JSON.stringify({ success: false, error: "Invalid action" });
      }

      case "manage_properties": {
        const { action, property_id, filters, ...propertyData } = args;
        
        if (action === "list") {
          let query = supabase.from("properties").select("*");
          if (filters && typeof filters === "object") {
            const f = filters as { property_type?: string; is_featured?: boolean };
            if (f.property_type) query = query.eq("property_type", f.property_type);
            if (f.is_featured !== undefined) query = query.eq("is_featured", f.is_featured);
          }
          const { data, error } = await query.order("created_at", { ascending: false });
          if (error) throw error;
          return JSON.stringify({ success: true, data, count: data?.length || 0 });
        }
        
        if (action === "get") {
          const { data, error } = await supabase.from("properties").select("*").eq("id", property_id).single();
          if (error) throw error;
          return JSON.stringify({ success: true, data });
        }
        
        if (action === "create") {
          const { data, error } = await supabase.from("properties").insert(propertyData).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Property listing created successfully" });
        }
        
        if (action === "update") {
          const { data, error } = await supabase.from("properties").update(propertyData).eq("id", property_id).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Property updated successfully" });
        }
        
        if (action === "delete") {
          const { error } = await supabase.from("properties").delete().eq("id", property_id);
          if (error) throw error;
          return JSON.stringify({ success: true, message: "Property deleted successfully" });
        }
        
        return JSON.stringify({ success: false, error: "Invalid action" });
      }

      case "manage_managed_properties": {
        const { action, property_id, address, total_units, notes } = args;
        
        if (action === "list") {
          const { data, error } = await supabase.from("managed_properties").select("*").order("created_at", { ascending: false });
          if (error) throw error;
          return JSON.stringify({ success: true, data, count: data?.length || 0 });
        }
        
        if (action === "get") {
          const { data, error } = await supabase.from("managed_properties").select("*").eq("id", property_id).single();
          if (error) throw error;
          return JSON.stringify({ success: true, data });
        }
        
        if (action === "create") {
          const { data, error } = await supabase.from("managed_properties").insert({
            address, total_units, notes
          }).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Managed property added successfully" });
        }
        
        if (action === "update") {
          const updates: Record<string, unknown> = {};
          if (address) updates.address = address;
          if (total_units !== undefined) updates.total_units = total_units;
          if (notes !== undefined) updates.notes = notes;
          const { data, error } = await supabase.from("managed_properties").update(updates).eq("id", property_id).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Managed property updated successfully" });
        }
        
        if (action === "delete") {
          const { error } = await supabase.from("managed_properties").delete().eq("id", property_id);
          if (error) throw error;
          return JSON.stringify({ success: true, message: "Managed property deleted successfully" });
        }
        
        return JSON.stringify({ success: false, error: "Invalid action" });
      }

      case "manage_leases": {
        const { action, lease_id, filters, ...leaseData } = args;
        
        if (action === "list") {
          let query = supabase.from("leases").select("*, tenants(name, email)");
          if (filters && typeof filters === "object") {
            const f = filters as { status?: string; tenant_id?: string };
            if (f.status) query = query.eq("status", f.status);
            if (f.tenant_id) query = query.eq("tenant_id", f.tenant_id);
          }
          const { data, error } = await query.order("created_at", { ascending: false });
          if (error) throw error;
          return JSON.stringify({ success: true, data, count: data?.length || 0 });
        }
        
        if (action === "get") {
          const { data, error } = await supabase.from("leases").select("*, tenants(name, email)").eq("id", lease_id).single();
          if (error) throw error;
          return JSON.stringify({ success: true, data });
        }
        
        if (action === "create") {
          const { data, error } = await supabase.from("leases").insert(leaseData).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Lease created successfully" });
        }
        
        if (action === "update") {
          const { data, error } = await supabase.from("leases").update(leaseData).eq("id", lease_id).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Lease updated successfully" });
        }
        
        if (action === "delete") {
          const { error } = await supabase.from("leases").delete().eq("id", lease_id);
          if (error) throw error;
          return JSON.stringify({ success: true, message: "Lease deleted successfully" });
        }
        
        return JSON.stringify({ success: false, error: "Invalid action" });
      }

      case "manage_payments": {
        const { action, payment_id, filters, ...paymentData } = args;
        
        if (action === "list") {
          let query = supabase.from("payments").select("*, leases(property_address, tenants(name))");
          if (filters && typeof filters === "object") {
            const f = filters as { status?: string; lease_id?: string };
            if (f.status) query = query.eq("status", f.status);
            if (f.lease_id) query = query.eq("lease_id", f.lease_id);
          }
          const { data, error } = await query.order("payment_date", { ascending: false });
          if (error) throw error;
          return JSON.stringify({ success: true, data, count: data?.length || 0 });
        }
        
        if (action === "get") {
          const { data, error } = await supabase.from("payments").select("*, leases(property_address, tenants(name))").eq("id", payment_id).single();
          if (error) throw error;
          return JSON.stringify({ success: true, data });
        }
        
        if (action === "create") {
          const insertData = {
            ...paymentData,
            payment_date: new Date().toISOString()
          };
          const { data, error } = await supabase.from("payments").insert(insertData).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Payment recorded successfully" });
        }
        
        if (action === "update") {
          const { data, error } = await supabase.from("payments").update(paymentData).eq("id", payment_id).select().single();
          if (error) throw error;
          return JSON.stringify({ success: true, data, message: "Payment updated successfully" });
        }
        
        return JSON.stringify({ success: false, error: "Invalid action" });
      }

      case "get_dashboard_stats": {
        const { period } = args;
        
        // Get date range based on period
        const now = new Date();
        let startDate: Date;
        
        switch (period) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "this_week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }

        // Get payments for the period
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("amount_cents, status")
          .gte("payment_date", startDate.toISOString());
        
        if (paymentsError) throw paymentsError;

        const completedPayments = payments?.filter(p => p.status === "completed") || [];
        const pendingPayments = payments?.filter(p => p.status === "pending") || [];
        
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount_cents || 0), 0);
        const pendingRent = pendingPayments.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

        // Get active leases count
        const { count: activeLeases } = await supabase
          .from("leases")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Get total tenants
        const { count: totalTenants } = await supabase
          .from("tenants")
          .select("*", { count: "exact", head: true });

        // Get property counts
        const { count: rentalCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("property_type", "rental");

        const { count: saleCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("property_type", "sale");

        // Get managed properties
        const { data: managedProps } = await supabase
          .from("managed_properties")
          .select("total_units");
        
        const totalUnits = managedProps?.reduce((sum, p) => sum + (p.total_units || 0), 0) || 0;

        return JSON.stringify({
          success: true,
          data: {
            period: period || "all_time",
            totalRevenue,
            totalRevenueFormatted: `$${(totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            pendingRent,
            pendingRentFormatted: `$${(pendingRent / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            completedPaymentsCount: completedPayments.length,
            pendingPaymentsCount: pendingPayments.length,
            activeLeases: activeLeases || 0,
            totalTenants: totalTenants || 0,
            rentalListings: rentalCount || 0,
            saleListings: saleCount || 0,
            totalManagedUnits: totalUnits
          }
        });
      }

      case "search_all": {
        const { query } = args;
        const searchTerm = `%${query}%`;
        
        const [tenantsResult, propertiesResult, managedResult] = await Promise.all([
          supabase.from("tenants").select("*").or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`),
          supabase.from("properties").select("*").or(`title.ilike.${searchTerm},address.ilike.${searchTerm}`),
          supabase.from("managed_properties").select("*").ilike("address", searchTerm)
        ]);

        return JSON.stringify({
          success: true,
          data: {
            tenants: tenantsResult.data || [],
            properties: propertiesResult.data || [],
            managed_properties: managedResult.data || []
          }
        });
      }

      default:
        return JSON.stringify({ success: false, error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${name}):`, error);
    return JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initial AI call with tools
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    let result = await response.json();
    let assistantMessage = result.choices[0].message;
    
    // Process tool calls in a loop until we get a final response
    const conversationMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];
    
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      conversationMessages.push(assistantMessage);
      
      // Execute all tool calls
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        const toolResult = await executeTool(toolName, toolArgs);
        console.log(`Tool result: ${toolResult.substring(0, 200)}...`);
        
        conversationMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Get next response from AI
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: conversationMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      result = await response.json();
      assistantMessage = result.choices[0].message;
    }

    return new Response(JSON.stringify({ 
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls || null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Admin assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
