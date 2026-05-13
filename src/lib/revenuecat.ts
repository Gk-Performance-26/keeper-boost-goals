import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesOffering,
} from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";

/**
 * RevenueCat integration for native iOS/Android in-app purchases.
 *
 * Uses the "default" Offering with the standard packages $rc_monthly and
 * $rc_annual, which point to the products premium_monthly_v2 and
 * premium_yearly_v2 in App Store Connect / Google Play Console.
 */

export const ENTITLEMENT_ID = "GKPerformanceHub Pro";

// Kept for reference / Paddle mapping. The actual purchase flow goes through
// RevenueCat packages, not raw product IDs.
export const PRODUCT_IDS = {
  ios: {
    monthly: "premium_monthly_v2",
    yearly: "premium_yearly_v2",
  },
  android: {
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

export function isNativePurchasesSupported(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android";
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

async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? offerings.all?.["default"] ?? null;
}

function pickPackage(offering: PurchasesOffering, plan: "monthly" | "yearly"): PurchasesPackage | null {
  const packages = offering.availablePackages ?? [];
  if (plan === "monthly") {
    return (
      offering.monthly ??
      packages.find((p) => p.identifier === "$rc_monthly") ??
      packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ??
      null
    );
  }
  return (
    offering.annual ??
    packages.find((p) => p.identifier === "$rc_annual") ??
    packages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ??
    null
  );
}

export async function purchasePlan(plan: "monthly" | "yearly"): Promise<CustomerInfo> {
  if (!initialized) {
    throw new Error("RevenueCat não foi inicializado. Tenta novamente.");
  }

  const offering = await getCurrentOffering();
  if (!offering) {
    throw new Error("Não foi possível obter a oferta de subscrição. Tenta novamente em instantes.");
  }

  const pkg = pickPackage(offering, plan);
  if (!pkg) {
    throw new Error(`Plano ${plan === "monthly" ? "mensal" : "anual"} não está disponível.`);
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

  try {
    const offering = await getCurrentOffering();
    if (!offering) return { monthly: null, yearly: null };

    const monthlyPkg = pickPackage(offering, "monthly");
    const yearlyPkg = pickPackage(offering, "yearly");

    return {
      monthly: monthlyPkg?.product.priceString ?? null,
      yearly: yearlyPkg?.product.priceString ?? null,
    };
  } catch (e) {
    console.warn("[RevenueCat] offerings unavailable", e);
    return { monthly: null, yearly: null };
  }
}
