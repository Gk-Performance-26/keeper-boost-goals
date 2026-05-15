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

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  console.log("[RevenueCat] configuring", {
    platform,
    appUserID: appUserId,
    apiKeyPreview: `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`,
    apiKeyLength: apiKey.length,
  });
  await Purchases.configure({ apiKey, appUserID: appUserId });
  initialized = true;
  console.log("[RevenueCat] configured OK");
}

async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const allKeys = Object.keys(offerings.all ?? {});
    const current = offerings.current ?? offerings.all?.["default"] ?? null;
    console.log("[RevenueCat] getOfferings result", {
      hasCurrent: !!offerings.current,
      currentIdentifier: offerings.current?.identifier ?? null,
      allOfferingKeys: allKeys,
      pickedOffering: current?.identifier ?? null,
      availablePackages:
        current?.availablePackages?.map((p) => ({
          identifier: p.identifier,
          packageType: p.packageType,
          productIdentifier: p.product?.identifier,
          priceString: p.product?.priceString,
        })) ?? [],
    });
    if (!current) {
      console.error("[RevenueCat] offerings empty — no current offering and no 'default' offering returned");
    } else if ((current.availablePackages ?? []).length === 0) {
      console.error(
        "[RevenueCat] offering has no packages — likely product not found in App Store Connect, bundle ID mismatch, or product not approved/ready",
      );
    }
    return current;
  } catch (err: any) {
    console.error("[RevenueCat] getOfferings FAILED", {
      message: err?.message,
      code: err?.code,
      underlyingErrorMessage: err?.underlyingErrorMessage,
      readableErrorCode: err?.readableErrorCode,
      raw: err,
    });
    throw err;
  }
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

  console.log("[RevenueCat] purchasing", {
    plan,
    offeringIdentifier: offering.identifier,
    packageIdentifier: pkg.identifier,
    packageType: pkg.packageType,
    productIdentifier: pkg.product?.identifier,
    priceString: pkg.product?.priceString,
  });

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

export type PlanPackages = {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
};

export async function fetchOfferingsPackages(): Promise<PlanPackages> {
  if (!initialized) {
    throw new Error("RevenueCat não foi inicializado.");
  }

  try {
    const offering = await getCurrentOffering();
    if (!offering) return { monthly: null, yearly: null };

    return {
      monthly: pickPackage(offering, "monthly"),
      yearly: pickPackage(offering, "yearly"),
    };
  } catch (e) {
    console.warn("[RevenueCat] offerings unavailable", e);
    return { monthly: null, yearly: null };
  }
}
