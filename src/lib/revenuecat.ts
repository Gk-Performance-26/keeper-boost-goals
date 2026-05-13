import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";

/**
 * RevenueCat integration for native iOS/Android in-app purchases.
 *
 * The public SDK keys (appl_/goog_) are stored as Lovable Cloud backend secrets
 * (REVENUECAT_IOS_API_KEY / REVENUECAT_ANDROID_API_KEY) and fetched at runtime
 * via the `get-revenuecat-config` edge function. We do this because Lovable
 * Cloud does not allow setting VITE_ build-time secrets, and these keys are
 * public (safe to ship to the client).
 *
 * The web build keeps using Paddle (this module never initializes on web).
 */

export const ENTITLEMENT_ID = "GKPerformanceHub Pro";

// Product identifiers configured in App Store Connect / Google Play Console.
export const PRODUCT_IDS = {
  ios: {
    monthly: "premium_monthly",
    yearly: "premium_yearly",
  },
  android: {
    // TODO: preencher quando as subscrições Android forem criadas no Google Play Console
    monthly: "",
    yearly: "",
  },
} as const;

let initialized = false;
let configCache: { ios: string | null; android: string | null } | null = null;
let configPromise: Promise<{ ios: string | null; android: string | null }> | null = null;

async function loadConfig() {
  if (configCache) return configCache;
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-revenuecat-config");
        if (error) throw error;
        configCache = {
          ios: (data?.ios as string | null) ?? null,
          android: (data?.android as string | null) ?? null,
        };
      } catch (e) {
        console.warn("[RevenueCat] failed to load config", e);
        configCache = { ios: null, android: null };
      }
      return configCache;
    })();
  }
  return configPromise;
}

/**
 * Synchronous capability check for UI gating. On native iOS/Android this
 * assumes the SDK key has been (or will be) provisioned server-side; the
 * actual key presence is verified inside `initRevenueCat` / `purchasePlan`.
 */
export function isNativePurchasesSupported(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return true;
  if (platform === "android") return !!PRODUCT_IDS.android.monthly;
  return false;
}

export async function initRevenueCat(appUserId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) {
    await Purchases.logIn({ appUserID: appUserId });
    return;
  }

  const platform = Capacitor.getPlatform();
  const config = await loadConfig();
  const apiKey = platform === "ios" ? config.ios : config.android;
  if (!apiKey) {
    console.warn(`[RevenueCat] No API key for platform ${platform}`);
    return;
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
  await Purchases.configure({ apiKey, appUserID: appUserId });
  initialized = true;
}

export async function purchasePlan(plan: "monthly" | "yearly"): Promise<CustomerInfo> {
  const platform = Capacitor.getPlatform() as "ios" | "android";
  const productId = PRODUCT_IDS[platform][plan];
  if (!productId) {
    throw new Error(`Plano ${plan} não está configurado para ${platform}.`);
  }

  if (!initialized) {
    throw new Error("RevenueCat não foi inicializado. Tenta novamente.");
  }

  // Fetch current offerings and find the package matching this product id.
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current || current.availablePackages.length === 0) {
    throw new Error(
      "As subscrições ainda não estão disponíveis. A configuração da loja está a ser finalizada — tenta novamente dentro de alguns minutos.",
    );
  }

  const pkg: PurchasesPackage | undefined = current.availablePackages.find(
    (p) => p.product.identifier === productId,
  );
  if (!pkg) {
    throw new Error(
      "Plano indisponível neste momento. Tenta novamente mais tarde ou contacta o suporte.",
    );
  }

  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return result.customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const result = await Purchases.restorePurchases();
  return result.customerInfo;
}

export function hasEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo) return false;
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export type PlanPrices = {
  monthly: string | null;
  yearly: string | null;
};

export async function fetchOfferingsPrices(): Promise<PlanPrices> {
  if (!initialized) {
    throw new Error("RevenueCat não foi inicializado.");
  }
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return { monthly: null, yearly: null };

  const platform = Capacitor.getPlatform() as "ios" | "android";

  const monthlyPkg = current.availablePackages.find(
    (p) => p.product.identifier === PRODUCT_IDS[platform].monthly,
  );
  const yearlyPkg = current.availablePackages.find(
    (p) => p.product.identifier === PRODUCT_IDS[platform].yearly,
  );

  return {
    monthly: monthlyPkg?.product.priceString ?? null,
    yearly: yearlyPkg?.product.priceString ?? null,
  };
}
