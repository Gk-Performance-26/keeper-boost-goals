import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

/**
 * RevenueCat integration for native iOS/Android in-app purchases.
 *
 * iOS: uses StoreKit (Apple Pay / App Store).
 * Android: uses Google Play Billing.
 *
 * The web build keeps using Paddle (this module never initializes on web).
 *
 * The iOS / Android API keys are RevenueCat **public SDK keys** (start with
 * `appl_` / `goog_`) — safe to ship in the client. They must be exposed as
 * Vite build env vars: VITE_REVENUECAT_IOS_API_KEY / VITE_REVENUECAT_ANDROID_API_KEY.
 */

const IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
const ANDROID_API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;

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

export function isNativePurchasesSupported(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return !!IOS_API_KEY;
  if (platform === "android") return !!ANDROID_API_KEY && !!PRODUCT_IDS.android.monthly;
  return false;
}

export async function initRevenueCat(appUserId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) {
    await Purchases.logIn({ appUserID: appUserId });
    return;
  }

  const platform = Capacitor.getPlatform();
  const apiKey = platform === "ios" ? IOS_API_KEY : ANDROID_API_KEY;
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

  // Fetch current offerings and find the package matching this product id.
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) {
    throw new Error("Nenhuma oferta disponível na loja. Verifica a configuração no RevenueCat.");
  }

  const pkg: PurchasesPackage | undefined = current.availablePackages.find(
    (p) => p.product.identifier === productId,
  );
  if (!pkg) {
    throw new Error(`Produto ${productId} não encontrado na oferta atual.`);
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
