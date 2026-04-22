import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Check, Crown, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Subscription = () => {
  const { user } = useAuth();
  const { isActive, hasPaidSub, isTrialActive, trialEndsAt, trialDaysLeft, subscription, isLoading } = useSubscription();
  const [opening, setOpening] = useState(false);
  const { t, lang } = useLanguage();

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
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId("premium_monthly");
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
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="space-y-1 p-4 text-center">
                  <h2 className="font-display text-base">{t("sub.trialEndedTitle")}</h2>
                  <p className="text-xs text-muted-foreground">{t("sub.trialEndedDesc")}</p>
                </CardContent>
              </Card>
            )}
            <Card className="gradient-card border-primary/30 shadow-glow">
              <CardContent className="space-y-4 p-5">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("sub.monthlyPlan")}</p>
                  <p className="mt-1 font-display text-4xl">
                    10€ <span className="text-base text-muted-foreground">{t("sub.month")}</span>
                  </p>
                </div>

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
                      <Lock className="h-4 w-4" /> {t("sub.subscribeBtn")}
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">{t("sub.cancelAnytime")}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default Subscription;
