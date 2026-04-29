import { createClient } from "npm:@supabase/supabase-js@2";
import { getPaddleClient, type PaddleEnv } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const env = ((body.environment as string) || "sandbox") as PaddleEnv;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.paddle_customer_id) {
      return new Response(JSON.stringify({ error: "No subscription found" }), { status: 404, headers: corsHeaders });
    }

    const paddle = getPaddleClient(env);

    // Try with stored customer id first; if Paddle says "not found", try to
    // recover the real customer id from the subscription itself (handles
    // env mismatches or customers recreated on Paddle's side).
    let customerId = sub.paddle_customer_id;
    let portal;
    try {
      portal = await paddle.customerPortalSessions.create(
        customerId,
        sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [],
      );
    } catch (err: any) {
      const notFound = err?.code === "not_found" || /not found/i.test(err?.detail ?? err?.message ?? "");
      if (notFound && sub.paddle_subscription_id) {
        try {
          const fresh = await paddle.subscriptions.get(sub.paddle_subscription_id);
          if (fresh?.customerId && fresh.customerId !== customerId) {
            customerId = fresh.customerId;
            portal = await paddle.customerPortalSessions.create(customerId, [sub.paddle_subscription_id]);
            // Persist the corrected customer id for future calls
            await supabase
              .from("subscriptions")
              .update({ paddle_customer_id: customerId, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
        } catch (recoverErr) {
          console.error("paddle-portal recovery failed:", recoverErr);
        }
      }
      if (!portal) {
        return new Response(
          JSON.stringify({
            error: "Portal unavailable",
            detail: err?.detail ?? err?.message ?? "unknown",
          }),
          { status: 200, headers: corsHeaders },
        );
      }
    }

    return new Response(
      JSON.stringify({
        overviewUrl: portal.urls.general.overview,
        subscriptionUrls: portal.urls.subscriptions ?? [],
      }),
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error("paddle-portal error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), { status: 500, headers: corsHeaders });
  }
});
