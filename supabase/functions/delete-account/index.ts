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

    // Client scoped to the requesting user (to identify them)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const env = ((body.environment as string) || "sandbox") as PaddleEnv;

    // Service-role client to perform privileged deletions
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Best-effort cancel any active Paddle subscription
    try {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("paddle_subscription_id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sub?.paddle_subscription_id && sub.status !== "canceled") {
        const paddle = getPaddleClient(env);
        await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
          effectiveFrom: "immediately",
        });
      }
    } catch (e) {
      console.warn("delete-account: paddle cancel failed (continuing):", e);
    }

    // 2) Delete user-owned rows across tables (RLS bypassed via service role)
    const tables = [
      "feedback",
      "skill_scores",
      "completed_sessions",
      "user_challenge_progress",
      "user_goals",
      "user_badges",
      "user_roles",
      "subscriptions",
      "profiles",
    ];
    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) console.warn(`delete-account: failed to clean ${table}:`, error.message);
    }

    // 3) Delete the auth user (cascades any auth-side data)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error("delete-account: auth delete failed:", delErr);
      return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
