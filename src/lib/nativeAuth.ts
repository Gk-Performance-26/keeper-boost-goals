import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

export const NATIVE_REDIRECT_URL =
  "https://gkperformancehub.com/auth/native-callback.html";
export const NATIVE_DEEP_LINK_PREFIX =
  "com.guilherme.gkperformancehub://auth/callback";

export const isNativePlatform = () => Capacitor.isNativePlatform();

/**
 * Native (Capacitor iOS/Android) OAuth flow.
 *
 * Flow:
 * 1. Ask Supabase for the OAuth URL with `skipBrowserRedirect:true` and
 *    `redirectTo` pointing at our public bridge page.
 * 2. Open that URL in the system browser (SFSafariViewController on iOS).
 * 3. The provider returns to the bridge page with tokens in the URL hash
 *    (or a `?code=` for PKCE), which immediately deep-links back into the
 *    app via `com.guilherme.gkperformancehub://auth/callback`.
 * 4. The deep-link listener registered in `installNativeAuthDeepLinkListener`
 *    parses the URL and finalises the session.
 */
export async function nativeSignInWithOAuth(provider: "google" | "apple") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Could not start OAuth flow");

  await Browser.open({ url: data.url, presentationStyle: "popover" });
}

let listenerInstalled = false;

/**
 * Registers a single global listener that turns deep-link callbacks
 * into a real Supabase session. Safe to call multiple times.
 */
export function installNativeAuthDeepLinkListener() {
  if (listenerInstalled || !isNativePlatform()) return;
  listenerInstalled = true;

  App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    try {
      const url = event.url;
      if (!url || !url.startsWith(NATIVE_DEEP_LINK_PREFIX)) return;

      // Extract both fragment (#access_token=...) and query (?code=...)
      const hashIndex = url.indexOf("#");
      const queryIndex = url.indexOf("?");
      const fragment = hashIndex >= 0 ? url.substring(hashIndex + 1) : "";
      const query =
        queryIndex >= 0 && (hashIndex < 0 || queryIndex < hashIndex)
          ? url.substring(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
          : "";

      const fragParams = new URLSearchParams(fragment);
      const queryParams = new URLSearchParams(query);

      const accessToken = fragParams.get("access_token");
      const refreshToken = fragParams.get("refresh_token");
      const code = queryParams.get("code");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // Close the in-app browser if it is still up.
      try {
        await Browser.close();
      } catch {
        /* no-op */
      }
    } catch (err) {
      // Surface in console; AuthContext will keep waiting otherwise.
      // eslint-disable-next-line no-console
      console.error("Native OAuth deep-link handling failed", err);
    }
  });
}
