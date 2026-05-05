import { createClient } from "npm:@supabase/supabase-js@2";
import { getPaddleClient, gatewayFetch, type PaddleEnv } from "../_shared/paddle.ts";

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
    const rawEnv = (body.environment as string) || "sandbox";
    if (rawEnv !== "sandbox" && rawEnv !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), { status: 400, headers: corsHeaders });
    }
    const env: PaddleEnv = rawEnv;
    const targetPriceKey = body.priceId as string; // e.g. "premium_monthly" | "premium_yearly"
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

    // Resolve human-readable price id to Paddle internal id
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
      const code = paddleErr?.code || paddleErr?.type;
      const detail: string = paddleErr?.detail || paddleErr?.message || "";
      const isNotFound =
        code === "not_found" ||
        /not found/i.test(detail);
      if (isNotFound) {
        // Verify the subscription doesn't exist in the OTHER Paddle env before
        // corrupting local state. Protects against client sending wrong `environment`.
        const otherEnv: PaddleEnv = env === "sandbox" ? "live" : "sandbox";
        let existsInOther = false;
        try {
          const otherPaddle = getPaddleClient(otherEnv);
          const otherSub = await otherPaddle.subscriptions.get(sub.paddle_subscription_id);
          if (otherSub) existsInOther = true;
        } catch (_) {
          existsInOther = false;
        }

        if (existsInOther) {
          return new Response(
            JSON.stringify({
              error: "WRONG_ENVIRONMENT",
              message:
                "A tua subscrição existe noutro ambiente de pagamento. Por favor, tenta novamente.",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        // Sync DB so the user is no longer shown as having an active subscription.
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
