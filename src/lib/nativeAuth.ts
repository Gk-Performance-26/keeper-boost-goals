import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";

export const NATIVE_REDIRECT_URL =
  "com.gkperformancehub.app://auth/callback";
export const NATIVE_DEEP_LINK_PREFIX =
  "com.gkperformancehub.app://auth/callback";
const NATIVE_OAUTH_BROKER_URL = "https://gkperformancehub.com/~oauth/initiate";
const NATIVE_OAUTH_WEB_CALLBACK_URL =
  "https://gkperformancehub.com/auth/native-callback.html";
const NATIVE_OAUTH_STATE_KEY = "native-oauth-state";

export const isNativePlatform = () => Capacitor.isNativePlatform();

const generateOAuthState = () => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

/**
 * Native (Capacitor iOS/Android) OAuth flow.
 *
 * Flow:
 * 1. Open Lovable Cloud's OAuth broker from the system browser.
 * 2. The OAuth redirect goes to a static web callback that immediately opens
 *    our custom URL scheme (`com.gkperformancehub.app://auth/callback`).
 * 3. The deep-link listener registered in `installNativeAuthDeepLinkListener`
 *    parses the URL and finalises the session.
 */
let deepLinkReceived = false;

export async function nativeSignInWithOAuth(
  provider: "google" | "apple",
): Promise<{ cancelled: boolean }> {
  const state = generateOAuthState();
  sessionStorage.setItem(NATIVE_OAUTH_STATE_KEY, state);
  deepLinkReceived = false;

  const params = new URLSearchParams({
    provider,
    redirect_uri: NATIVE_OAUTH_WEB_CALLBACK_URL,
    native_redirect_uri: NATIVE_REDIRECT_URL,
    state,
  });

  // Wait for either a deep-link callback or the user closing the in-app browser.
  const finishedPromise = new Promise<{ cancelled: boolean }>((resolve) => {
    const handlePromise = Browser.addListener("browserFinished", () => {
      handlePromise
        .then((h) => h.remove())
        .catch(() => {
          /* no-op */
        });
      // Give the deep-link listener a brief chance to fire first.
      setTimeout(() => {
        resolve({ cancelled: !deepLinkReceived });
      }, 500);
    });
  });

  await Browser.open({
    url: `${NATIVE_OAUTH_BROKER_URL}?${params.toString()}`,
    presentationStyle: "popover",
  });

  return finishedPromise;
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
      deepLinkReceived = true;

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
      const returnedState = queryParams.get("state") ?? fragParams.get("state");
      const expectedState = sessionStorage.getItem(NATIVE_OAUTH_STATE_KEY);

      if (expectedState && returnedState && returnedState !== expectedState) {
        throw new Error("Native OAuth state is invalid");
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      sessionStorage.removeItem(NATIVE_OAUTH_STATE_KEY);

      // Close the in-app browser if it is still up.
      try {
        await Browser.close();
      } catch {
        /* no-op */
      }

      window.location.replace("/");
    } catch (err) {
      // Surface in console; AuthContext will keep waiting otherwise.
      // eslint-disable-next-line no-console
      console.error("Native OAuth deep-link handling failed", err);
    }
  });
}
