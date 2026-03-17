// @ts-nocheck
// Supabase Edge Function (Deno)
// Deploy this function and set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// Then call via supabase.functions.invoke('create-admin', { body: { loginId, password, role, businessId } })

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { loginId, password, role, businessId } = await req.json();

    if (!loginId || !password || !role || !businessId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("https://viopuadkgibsvixpjdps.supabase.co") ?? "";
    const serviceKey = Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpb3B1YWRrZ2lic3ZpeHBqZHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTkxODEsImV4cCI6MjA4NDYzNTE4MX0.GF8W_hxoWaWy3efX6b1Rw039E0OVzGE2X5ftQbs4poY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
        status: 500,
      });
    }
    const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const normalizedLoginId = String(loginId).trim();
    const email = `${normalizedLoginId.toLowerCase()}@admin.local`;
    const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { login_id: normalizedLoginId, role, business_id: businessId },
    });

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: userError?.message ?? "User create failed" }), { status: 400 });
    }

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userData.user.id,
      login_id: normalizedLoginId,
      role,
      business_id: businessId,
    });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
