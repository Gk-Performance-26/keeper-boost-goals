import { createClient } from "npm:@supabase/supabase-js@2";
import { getPaddleClient, gatewayFetch, type PaddleEnv } from "../_shared/paddle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
};

/**
 * Detect which Paddle environment a subscription actually lives in.
 * The client-supplied `environment` is only a hint — historic subscriptions
 * may have been created in a different env (e.g. sandbox) than the published
 * app currently uses (live). We probe Paddle to find the real env.
 */
async function detectSubscriptionEnv(
  subscriptionId: string,
  preferred: PaddleEnv,
): Promise<PaddleEnv | null> {
  const order: PaddleEnv[] = preferred === "live" ? ["live", "sandbox"] : ["sandbox", "live"];
  for (const env of order) {
    try {
      const paddle = getPaddleClient(env);
      const found = await paddle.subscriptions.get(subscriptionId);
      if (found) return env;
    } catch (_) {
      // try next
    }
  }
  return null;
}

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
    const rawEnv = (body.environment as string) || "live";
    if (rawEnv !== "sandbox" && rawEnv !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), { status: 400, headers: corsHeaders });
    }
    const preferredEnv: PaddleEnv = rawEnv;
    const targetPriceKey = body.priceId as string;
    if (!targetPriceKey) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), { status: 400, headers: corsHeaders });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, price_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: "No subscription found" }), { status: 404, headers: corsHeaders });
    }

    if (sub.price_id === targetPriceKey) {
      return new Response(JSON.stringify({ error: "Already on this plan" }), { status: 400, headers: corsHeaders });
    }

    // Detect the real environment of this subscription instead of trusting the client.
    const env = await detectSubscriptionEnv(sub.paddle_subscription_id, preferredEnv);
    if (!env) {
      // Truly missing in both envs — sync DB.
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          current_period_end: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          error: "SUBSCRIPTION_NOT_FOUND",
          message:
            "A subscrição associada à tua conta já não existe no sistema de pagamentos. Por favor, subscreve novamente o plano pretendido.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Resolve human-readable price id to Paddle internal id in the correct env.
    const priceLookup = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(targetPriceKey)}`);
    const priceData = await priceLookup.json();
    if (!priceData.data?.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), { status: 404, headers: corsHeaders });
    }
    const paddlePriceId = priceData.data[0].id;

    const paddle = getPaddleClient(env);
    try {
      await paddle.subscriptions.update(sub.paddle_subscription_id, {
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        prorationBillingMode: "prorated_immediately",
      });
    } catch (paddleErr: any) {
      console.error("Paddle update error:", paddleErr);
      const detail: string = paddleErr?.detail || paddleErr?.message || "";
      return new Response(
        JSON.stringify({
          error: "PADDLE_UPDATE_FAILED",
          message: detail || "Não foi possível atualizar o plano. Tenta novamente mais tarde.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (e) {
    console.error("change-subscription-plan error:", e);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: "Ocorreu um erro interno. Tenta novamente." }),
      { status: 200, headers: corsHeaders },
    );
  }
});
