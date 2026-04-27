// Generates a short-lived signed URL for a training video file.
// Enforces server-side: only authenticated users may sign URLs, and only
// for trainings they're allowed to watch (public, owned subscription, or admin).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "training-videos";
const SIGN_TTL_SECONDS = 60 * 60; // 1 hour

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Accepts either a full Supabase storage URL or a bare object path and
 * returns the storage path inside the training-videos bucket. Returns null
 * if the URL doesn't belong to this bucket.
 */
function extractPath(input: string): string | null {
  if (!input) return null;
  // Already a path (no protocol)
  if (!/^https?:\/\//i.test(input)) {
    return input.replace(/^\/+/, "");
  }
  try {
    const url = new URL(input);
    // Match /storage/v1/object/(public|sign|authenticated)/<bucket>/<path...>
    const m = url.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    );
    if (!m) return null;
    if (m[1] !== BUCKET) return null;
    // Strip any query string from the path itself
    return decodeURIComponent(m[2].split("?")[0]);
  } catch {
    return null;
  }
}

interface DrillShape {
  intro_video_url?: string | null;
  intro_video_type?: string | null;
  exercise_video_url?: string | null;
  exercise_video_type?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ error: "Missing Authorization" }, 401);
    }

    // User-scoped client for auth.getUser()
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const trainingId: string | undefined = body?.training_id;
    const field: string = body?.field ?? "main"; // "main" | "intro" | "drill_intro" | "drill_exercise"
    const drillIndex: number | undefined =
      typeof body?.drill_index === "number" ? body.drill_index : undefined;

    if (!trainingId || typeof trainingId !== "string") {
      return jsonResponse({ error: "training_id required" }, 400);
    }

    // Service-role client for trusted DB reads + signing
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: training, error: trErr } = await admin
      .from("trainings")
      .select(
        "id, is_premium, is_published, video_url, video_type, intro_video_url, intro_video_type, drills",
      )
      .eq("id", trainingId)
      .maybeSingle();
    if (trErr) return jsonResponse({ error: trErr.message }, 500);
    if (!training || !training.is_published) {
      return jsonResponse({ error: "Training not available" }, 404);
    }

    // Authorization gate
    if (training.is_premium) {
      const { data: isAdmin } = await admin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      let allowed = !!isAdmin;
      if (!allowed) {
        const { data: hasSub } = await admin.rpc("has_active_subscription", {
          _user_id: userId,
        });
        allowed = !!hasSub;
      }
      if (!allowed) {
        return jsonResponse({ error: "Subscription required" }, 403);
      }
    }

    // Resolve which URL to sign
    let sourceUrl: string | null = null;
    let sourceType: string | null = null;
    if (field === "main") {
      sourceUrl = training.video_url;
      sourceType = training.video_type;
    } else if (field === "intro") {
      sourceUrl = (training as any).intro_video_url ?? null;
      sourceType = (training as any).intro_video_type ?? null;
    } else if (
      (field === "drill_intro" || field === "drill_exercise") &&
      typeof drillIndex === "number"
    ) {
      const drills = (training.drills as DrillShape[] | null) ?? [];
      const drill = drills[drillIndex];
      if (!drill) return jsonResponse({ error: "Drill not found" }, 404);
      if (field === "drill_intro") {
        sourceUrl = drill.intro_video_url ?? null;
        sourceType = drill.intro_video_type ?? null;
      } else {
        sourceUrl = drill.exercise_video_url ?? null;
        sourceType = drill.exercise_video_type ?? null;
      }
    } else {
      return jsonResponse({ error: "Invalid field" }, 400);
    }

    if (!sourceUrl) {
      return jsonResponse({ error: "No video for this field" }, 404);
    }

    // Only sign uploaded files. YouTube/Vimeo URLs are returned as-is.
    if (sourceType !== "upload") {
      return jsonResponse({ url: sourceUrl, type: sourceType });
    }

    const path = extractPath(sourceUrl);
    if (!path) {
      return jsonResponse({ error: "Video path could not be resolved" }, 422);
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGN_TTL_SECONDS);
    if (signErr || !signed?.signedUrl) {
      return jsonResponse(
        { error: signErr?.message ?? "Could not sign URL" },
        500,
      );
    }

    return jsonResponse({ url: signed.signedUrl, type: "upload" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: msg }, 500);
  }
});
