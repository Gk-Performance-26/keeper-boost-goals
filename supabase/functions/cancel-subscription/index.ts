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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const env = ((body.environment as string) || "sandbox") as PaddleEnv;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub?.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: "No subscription found" }), { status: 404, headers: corsHeaders });
    }

    const paddle = getPaddleClient(env);
    try {
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, { effectiveFrom: "next_billing_period" });
    } catch (paddleErr: any) {
      console.error("Paddle cancel error:", paddleErr);
      const code = paddleErr?.code || paddleErr?.type;
      const detail: string = paddleErr?.detail || paddleErr?.message || "";
      const isNotFound = code === "not_found" || /not found/i.test(detail);
      if (isNotFound) {
        // Subscription no longer exists in Paddle — sync our DB to reflect that.
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
            ok: true,
            synced: true,
            message:
              "A tua subscrição já não existia no sistema de pagamentos. O teu estado foi atualizado.",
          }),
          { status: 200, headers: corsHeaders },
        );
      }
      return new Response(
        JSON.stringify({
          error: "PADDLE_CANCEL_FAILED",
          message: detail || "Não foi possível cancelar a subscrição. Tenta novamente mais tarde.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (e) {
    console.error("cancel-subscription error:", e);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: "Ocorreu um erro interno. Tenta novamente." }),
      { status: 200, headers: corsHeaders },
    );
  }
});
