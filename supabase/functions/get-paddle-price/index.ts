import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const ALLOWED_PRICE_IDS = new Set(["premium_monthly", "premium_yearly"]);

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Content-Type": "application/json",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, responseHeaders);
  }

  try {
    // Require an authenticated user to prevent abuse of the Paddle gateway.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        ...responseHeaders,
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace(/^[Bb]earer\s+/, "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        ...responseHeaders,
      });
    }

    const { priceId, environment } = await req.json();
    if (!priceId || typeof priceId !== "string" || !ALLOWED_PRICE_IDS.has(priceId)) {
      return new Response(JSON.stringify({ error: "priceId required" }), {
        status: 400,
        ...responseHeaders,
      });
    }

    // Strict allowlist for environment values.
    const env: PaddleEnv = environment === "live" ? "live" : "sandbox";
    const response = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`);
    const data = await response.json();

    if (!data.data?.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        ...responseHeaders,
      });
    }

    return new Response(JSON.stringify({ paddleId: data.data[0].id }), responseHeaders);
  } catch (e) {
    console.error("get-paddle-price error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      ...responseHeaders,
    });
  }
});
