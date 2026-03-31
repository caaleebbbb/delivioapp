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
    const { order_id, declined_driver_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find a new random available driver (excluding the one who declined)
    let query = supabase
      .from("profiles")
      .select("id")
      .eq("role", "driver")
      .eq("is_available", true)
      .limit(1);

    if (declined_driver_id) {
      query = query.neq("id", declined_driver_id);
    }

    const { data: drivers } = await query;

    if (drivers && drivers.length > 0) {
      // Assign to new driver
      await supabase
        .from("orders")
        .update({
          offered_to_driver_id: drivers[0].id,
          offer_expires_at: new Date(Date.now() + 20000).toISOString(),
        })
        .eq("id", order_id);

      return new Response(JSON.stringify({ reassigned: true, driver_id: drivers[0].id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // No drivers available, clear offer
      await supabase
        .from("orders")
        .update({
          offered_to_driver_id: null,
          offer_expires_at: null,
        })
        .eq("id", order_id);

      return new Response(JSON.stringify({ reassigned: false, message: "No available drivers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
