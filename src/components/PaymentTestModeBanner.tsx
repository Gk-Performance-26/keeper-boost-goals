import { isTestMode } from "@/lib/paddle";
import { useLanguage } from "@/contexts/LanguageContext";

export function PaymentTestModeBanner() {
  const { t } = useLanguage();
  if (!isTestMode()) return null;

  return (
    <div className="w-full border-b border-orange-300 bg-orange-100 px-4 py-2 text-center text-xs text-orange-800">
      {t("sub.testBanner")}{" "}
      <span className="font-mono font-semibold">4242 4242 4242 4242</span> {t("sub.testBannerSuffix")}
    </div>
  );
}
