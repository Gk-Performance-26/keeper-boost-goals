import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from "@revenuecat/purchases-capacitor";
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
    monthly: "premium_monthly_v2",
    yearly: "premium_yearly_v2",
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

  const item = await findPurchasableItem(platform, productId);
  const result = item.kind === "package"
    ? await Purchases.purchasePackage({ aPackage: item.value })
    : await Purchases.purchaseStoreProduct({ product: item.value });
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
  const platform = Capacitor.getPlatform() as "ios" | "android";
  const monthlyId = PRODUCT_IDS[platform].monthly;
  const yearlyId = PRODUCT_IDS[platform].yearly;

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (current) {
      const monthlyPkg = current.availablePackages.find((p) => p.product.identifier === monthlyId);
      const yearlyPkg = current.availablePackages.find((p) => p.product.identifier === yearlyId);
      if (monthlyPkg || yearlyPkg) {
        return {
          monthly: monthlyPkg?.product.priceString ?? null,
          yearly: yearlyPkg?.product.priceString ?? null,
        };
      }
    }
  } catch (e) {
    console.warn("[RevenueCat] offerings unavailable, trying products directly", e);
  }

  return fetchStoreProductPrices(platform);
}

type PurchasableItem =
  | { kind: "package"; value: PurchasesPackage }
  | { kind: "product"; value: PurchasesStoreProduct };

async function findPurchasableItem(platform: "ios" | "android", productId: string): Promise<PurchasableItem> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
    if (pkg) return { kind: "package", value: pkg };
  } catch (e) {
    console.warn("[RevenueCat] offerings unavailable, trying product directly", e);
  }

  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: [productId] });
    const product = products.find((p) => p.identifier === productId);
    if (product) return { kind: "product", value: product };
  } catch (e) {
    console.warn("[RevenueCat] product fetch failed", e);
  }

  throw new Error(getStoreConfigurationMessage(platform));
}

async function fetchStoreProductPrices(platform: "ios" | "android"): Promise<PlanPrices> {
  const productIds = [PRODUCT_IDS[platform].monthly, PRODUCT_IDS[platform].yearly].filter(Boolean);
  if (productIds.length === 0) return { monthly: null, yearly: null };

  try {
    const { products } = await Purchases.getProducts({ productIdentifiers: productIds });
    const monthlyProduct = products.find((p) => p.identifier === PRODUCT_IDS[platform].monthly);
    const yearlyProduct = products.find((p) => p.identifier === PRODUCT_IDS[platform].yearly);

    return {
      monthly: monthlyProduct?.priceString ?? null,
      yearly: yearlyProduct?.priceString ?? null,
    };
  } catch (e) {
    console.warn("[RevenueCat] product prices unavailable", e);
    return { monthly: null, yearly: null };
  }
}

function getStoreConfigurationMessage(platform: "ios" | "android"): string {
  if (platform === "ios") {
    return "As compras da App Store ainda não estão disponíveis neste build. Confirma no RevenueCat e no App Store Connect que os produtos premium_monthly_v2 e premium_yearly_v2 existem exatamente com estes IDs, estão ligados ao bundle ID do TestFlight e fazem parte da Offering atual.";
  }
  return "As compras da Google Play ainda não estão disponíveis neste build. Confirma a configuração dos produtos no RevenueCat e na Google Play Console.";
}
