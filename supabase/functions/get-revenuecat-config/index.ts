// Returns the public RevenueCat SDK keys (appl_/goog_) to the native client.
// These are PUBLIC keys — safe to expose. They are stored as backend secrets
// (REVENUECAT_IOS_API_KEY / REVENUECAT_ANDROID_API_KEY) because Lovable Cloud
// does not allow setting VITE_ build-time secrets.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const ios = Deno.env.get("REVENUECAT_IOS_API_KEY") ?? null;
  const android = Deno.env.get("REVENUECAT_ANDROID_API_KEY") ?? null;
  return new Response(JSON.stringify({ ios, android }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
