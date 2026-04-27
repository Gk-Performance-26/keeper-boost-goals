import { Link } from "react-router-dom";
import { ArrowLeft, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import gkLogo from "@/assets/gk-logo.jpg";

const Pricing = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const benefits = [
    t("sub.benefit1"),
    t("sub.benefit2"),
    t("sub.benefit3"),
    t("sub.benefit4"),
    t("sub.benefit5"),
    t("sub.benefit6"),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-10 max-w-3xl mx-auto space-y-8">
        <Link to={user ? "/profile" : "/auth"}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Button>
        </Link>

        <header className="space-y-3 text-center">
          <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl shadow-glow ring-1 ring-primary/30">
            <img src={gkLogo} alt="GK Performance Hub" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-display text-3xl">
            GK <span className="text-gradient-primary">PERFORMANCE</span> HUB
          </h1>
          <p className="text-sm text-muted-foreground">{t("pricing.subtitle")}</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gradient-card border-border/60">
            <CardContent className="space-y-3 p-6">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("sub.monthlyPlan")}
              </p>
              <p className="font-display text-3xl">
                10€<span className="text-sm text-muted-foreground">{t("sub.month")}</span>
              </p>
              <p className="text-xs text-muted-foreground">{t("pricing.monthlyDesc")}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-primary/40 shadow-glow relative">
            <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {t("sub.savePercent")}
            </span>
            <CardContent className="space-y-3 p-6">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("sub.yearlyPlan")}
              </p>
              <p className="font-display text-3xl">
                96€<span className="text-sm text-muted-foreground">{t("sub.year")}</span>
              </p>
              <p className="text-xs text-primary">{t("sub.perMonthEquivalent")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="gradient-card border-primary/30">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg">{t("pricing.whatYouGet")}</h2>
            </div>
            <ul className="space-y-2.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-3 text-center">
          <Link to={user ? "/subscription" : "/auth"}>
            <Button size="lg" className="w-full md:w-auto shadow-glow">
              {user ? t("pricing.subscribeNow") : t("pricing.getStarted")}
            </Button>
          </Link>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1.5 text-left">
            <p className="font-semibold text-foreground">{t("pricing.disclosureTitle")}</p>
            <p>{t("pricing.disclosure")}</p>
            <p className="pt-1">
              <Link to="/terms" className="underline hover:text-foreground">
                {t("profile.terms")}
              </Link>
              {" · "}
              <Link to="/privacy" className="underline hover:text-foreground">
                {t("profile.privacy")}
              </Link>
              {" · "}
              <Link to="/refund" className="underline hover:text-foreground">
                {t("pricing.refundPolicy")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
