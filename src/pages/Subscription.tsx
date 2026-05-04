import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, Check, Crown, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { initializePaddle, getPaddlePriceId, isTestMode } from "@/lib/paddle";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Plan = "monthly" | "yearly";

const Subscription = () => {
  const { user } = useAuth();
  const { hasPaidSub, isTrialActive, trialEndsAt, trialDaysLeft, subscription, isLoading, refetch } =
    useSubscription();
  const [opening, setOpening] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [plan, setPlan] = useState<Plan>("yearly");
  const { t, lang } = useLanguage();

  const isYearly = subscription?.price_id === "premium_yearly";

  // On the web, if we receive ?checkout=premium_yearly&uid=...&email=..., auto-open Paddle
  // (this is the entry point used when the iOS app opens the web checkout in Safari).
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const uid = params.get("uid");
    const email = params.get("email");
    if (!checkout || !uid) return;
    (async () => {
      try {
        await initializePaddle();
        const paddlePriceId = await getPaddlePriceId(checkout);
        window.Paddle.Checkout.open({
          items: [{ priceId: paddlePriceId, quantity: 1 }],
          customer: email ? { email } : undefined,
          customData: { userId: uid },
          settings: {
            displayMode: "overlay",
            successUrl: `${window.location.origin}/subscription?success=1`,
            allowLogout: false,
            variant: "one-page",
          },
        });
      } catch (e: any) {
        toast.error(e.message);
      }
    })();
  }, []);

  if (!user) return <Navigate to="/auth" replace />;

  const benefits = [
    t("sub.benefit1"),
    t("sub.benefit2"),
    t("sub.benefit3"),
    t("sub.benefit4"),
    t("sub.benefit5"),
    t("sub.benefit6"),
  ];

  const openCheckout = async () => {
    setOpening(true);
    try {
      // On native apps (iOS/Android), Paddle.js cannot run inside the
      // capacitor:// WebView — open the hosted web checkout in the system browser.
      if (Capacitor.isNativePlatform()) {
        const priceKey = plan === "yearly" ? "premium_yearly" : "premium_monthly";
        const url = `https://gkperformancehub.com/subscription?checkout=${priceKey}&uid=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? "")}`;
        await Browser.open({ url });
        return;
      }

      await initializePaddle();
      const priceKey = plan === "yearly" ? "premium_yearly" : "premium_monthly";
      const paddlePriceId = await getPaddlePriceId(priceKey);
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
        settings: {
          displayMode: "overlay",
          successUrl: `${window.location.origin}/subscription?success=1`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e: any) {
      toast.error(t("sub.checkoutError") + e.message);
    } finally {
      setOpening(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-subscription", {
        body: { environment: isTestMode() ? "sandbox" : "live" },
      });
      if (error) throw error;
      toast.success(t("sub.cancelSuccess"));
      await refetch();
    } catch (e: any) {
      toast.error(t("sub.cancelError") + (e.message ?? ""));
    } finally {
      setCancelling(false);
    }
  };

  const handleSwitchPlan = async () => {
    const targetPriceId = isYearly ? "premium_monthly" : "premium_yearly";
    setSwitching(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
        body: { environment: isTestMode() ? "sandbox" : "live", priceId: targetPriceId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.message || t("sub.switchError"));
        return;
      }
      toast.success(t("sub.switchSuccess"));
      await refetch();
    } catch (e: any) {
      toast.error(t("sub.switchError") + (e.message ?? ""));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <PaymentTestModeBanner />
      <div className="space-y-6 px-5 pt-6 pb-10">
        <Link to="/profile" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>

        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-glow">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl">{t("sub.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sub.subtitle")}</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : hasPaidSub ? (
          <>
            <Card className="gradient-card border-primary/40 shadow-glow">
              <CardContent className="space-y-3 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-xl">{t("sub.activeTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("sub.activeDesc")}</p>
                {subscription?.current_period_end && (
                  <p className="text-xs text-muted-foreground">
                    {t("sub.nextRenewal")}{" "}
                    {new Date(subscription.current_period_end).toLocaleDateString(
                      lang === "pt" ? "pt-PT" : "en-GB",
                    )}
                  </p>
                )}
                {subscription?.cancel_at_period_end && (
                  <p className="text-xs text-amber-500">{t("sub.cancelAtEnd")}</p>
                )}
              </CardContent>
            </Card>

            {!subscription?.cancel_at_period_end && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ArrowRightLeft className="h-4 w-4" />{" "}
                    {isYearly ? t("sub.switchToMonthly") : t("sub.switchToYearly")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isYearly ? t("sub.switchToMonthly") : t("sub.switchToYearly")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isYearly ? t("sub.switchConfirmMonthly") : t("sub.switchConfirmYearly")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSwitchPlan} disabled={switching}>
                      {switching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {t("sub.switching")}
                        </>
                      ) : (
                        t("sub.confirm")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!subscription?.cancel_at_period_end && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    <X className="h-4 w-4" /> {t("sub.cancelSub")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("sub.cancelSub")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("sub.cancelConfirm")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {t("sub.canceling")}
                        </>
                      ) : (
                        t("sub.cancelSub")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        ) : (
          <>
            {isTrialActive && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="space-y-2 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-display text-lg">{t("sub.trialTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("sub.trialDesc")}</p>
                  <p className="text-sm font-medium text-primary">
                    {trialDaysLeft} {trialDaysLeft === 1 ? t("sub.trialDayLeft") : t("sub.trialDaysLeft")}
                  </p>
                  {trialEndsAt && (
                    <p className="text-xs text-muted-foreground">
                      {t("sub.trialEndsOn")}{" "}
                      {trialEndsAt.toLocaleDateString(lang === "pt" ? "pt-PT" : "en-GB")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {!isTrialActive && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardContent className="space-y-1 p-4 text-center">
                  <h2 className="font-display text-base">{t("sub.trialEndedTitle")}</h2>
                  <p className="text-xs text-muted-foreground">{t("sub.trialEndedDesc")}</p>
                </CardContent>
              </Card>
            )}

            {/* Plan toggle */}
            <div className="space-y-2">
              <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                {t("sub.choosePlan")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={`rounded-xl border p-3 text-left transition ${
                    plan === "monthly"
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border/60 bg-card/50 hover:border-border"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("sub.monthlyPlan")}
                  </p>
                  <p className="mt-0.5 font-display text-lg">
                    10€<span className="text-xs text-muted-foreground">{t("sub.month")}</span>
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  className={`relative rounded-xl border p-3 text-left transition ${
                    plan === "yearly"
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border/60 bg-card/50 hover:border-border"
                  }`}
                >
                  <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    {t("sub.savePercent")}
                  </span>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("sub.yearlyPlan")}
                  </p>
                  <p className="mt-0.5 font-display text-lg">
                    96€<span className="text-xs text-muted-foreground">{t("sub.year")}</span>
                  </p>
                  <p className="text-[10px] text-primary">{t("sub.perMonthEquivalent")}</p>
                </button>
              </div>
            </div>

            <Card className="gradient-card border-primary/30 shadow-glow">
              <CardContent className="space-y-4 p-5">
                <ul className="space-y-2.5">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="w-full shadow-glow"
                  onClick={openCheckout}
                  disabled={opening}
                >
                  {opening ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("sub.opening")}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />{" "}
                      {t("sub.subscribeBtn")} {plan === "yearly" ? "96€/ano" : "10€/mês"}
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">{t("sub.cancelAnytime")}</p>

                {/* Apple App Store required subscription disclosure */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground">{t("sub.disclosureTitle")}</p>
                  <p>{t("sub.disclosurePrice")}</p>
                  <p>{t("sub.disclosureRenewal")}</p>
                  <p>{t("sub.disclosureCancel")}</p>
                  <p className="pt-1">
                    <Link to="/terms" className="underline hover:text-foreground">
                      {t("profile.terms")}
                    </Link>
                    {" · "}
                    <Link to="/privacy" className="underline hover:text-foreground">
                      {t("profile.privacy")}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default Subscription;
