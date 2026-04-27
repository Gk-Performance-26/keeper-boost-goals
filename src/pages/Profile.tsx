import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBar } from "@/components/LevelBar";
import { CreditCard, Crown, FileText, Flame, Loader2, LogOut, MessageSquare, RotateCw, Settings, Shield, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { isTestMode } from "@/lib/paddle";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { isActive: hasSub, hasPaidSub, refetch: refetchSub } = useSubscription();
  const { t } = useLanguage();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      await refetchSub();
      toast.success(t("profile.restoreSuccess"));
    } catch (e: any) {
      toast.error(t("profile.restoreError") + (e.message ?? ""));
    } finally {
      setRestoring(false);
    }
  };

  const loadPortalUrl = useCallback(async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("paddle-portal", {
        body: { environment: isTestMode() ? "sandbox" : "live" },
      });
      if (error) throw error;
      const url = data?.subscriptionUrls?.[0]?.updateSubscriptionPaymentMethod ?? data?.overviewUrl;
      if (!url) throw new Error("No portal URL");

      // Validate URL: must be a complete, well-formed Paddle portal URL
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        throw new Error("Invalid portal URL");
      }
      if (parsed.protocol !== "https:") {
        throw new Error("Insecure portal URL");
      }
      const allowedHosts = [
        "customer-portal.paddle.com",
        "sandbox-customer-portal.paddle.com",
      ];
      const isAllowedHost = allowedHosts.some(
        (h) => parsed.hostname === h || parsed.hostname.endsWith("." + h),
      );
      if (!isAllowedHost) {
        throw new Error("Unexpected portal domain: " + parsed.hostname);
      }
      if (!parsed.pathname || parsed.pathname === "/") {
        throw new Error("Incomplete portal URL");
      }
      const validUrl = parsed.toString();
      setPortalUrl(validUrl);
      return validUrl;
    } catch (e: any) {
      toast.error(t("profile.portalError") + (e.message ?? ""));
      return null;
    } finally {
      setOpeningPortal(false);
    }
  }, [t]);

  useEffect(() => {
    if (hasPaidSub && !portalUrl && !openingPortal) {
      void loadPortalUrl();
    }
  }, [hasPaidSub, loadPortalUrl, openingPortal, portalUrl]);

  if (!profile) return null;

  return (
    <div className="space-y-5 px-5 pt-8 pb-6">
      <header className="flex flex-col items-center gap-3 pt-4 text-center">
        <Avatar className="h-24 w-24 ring-4 ring-primary/30 shadow-glow">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-3xl">
            {(profile.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-2xl">{profile.display_name ?? t("profile.fallbackName")}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {t(`level.${profile.experience_level}`)} · {profile.age_group ?? "—"}
          </p>
          {hasSub && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Crown className="h-3 w-3" /> {t("trainings.premium")}
            </span>
          )}
        </div>
      </header>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-3 p-4">
          <LevelBar totalXp={profile.total_xp} />
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <Stat icon={<Sparkles className="h-3 w-3" />} value={profile.total_xp} label={t("profile.statXp")} />
            <Stat icon={<Flame className="h-3 w-3" />} value={profile.current_streak} label={t("profile.statStreak")} />
            <Stat icon={<Trophy className="h-3 w-3" />} value={profile.longest_streak} label={t("profile.statBest")} />
          </div>
        </CardContent>
      </Card>

      {profile.training_goal && (
        <Card className="gradient-card border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.myGoal")}</p>
            <p className="mt-1 text-sm">{profile.training_goal}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Link to="/subscription">
          <Button
            variant="outline"
            className={`w-full justify-start ${hasSub ? "" : "border-primary/40 text-primary hover:bg-primary/10"}`}
          >
            <Crown className="h-4 w-4" />
            {hasSub ? t("profile.managePremium") : t("profile.becomePremium")}
          </Button>
        </Link>
        {hasPaidSub && portalUrl ? (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
          >
            <CreditCard className="h-4 w-4" /> {t("profile.paymentMethods")}
          </a>
        ) : hasPaidSub ? (
          <Button variant="outline" className="w-full justify-start" onClick={loadPortalUrl} disabled={openingPortal}>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("profile.openingPortal")}
          </Button>
        ) : null}
        <Link to="/onboarding">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4" /> {t("profile.editProfile")}
          </Button>
        </Link>
        <FeedbackDialog>
          <Button variant="outline" className="w-full justify-start">
            <MessageSquare className="h-4 w-4" /> {t("profile.feedback")}
          </Button>
        </FeedbackDialog>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleRestorePurchases}
          disabled={restoring}
        >
          {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {t("profile.restorePurchases")}
        </Button>
        <Link to="/privacy">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="h-4 w-4" /> {t("profile.privacy")}
          </Button>
        </Link>
        <Link to="/terms">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4" /> {t("profile.terms")}
          </Button>
        </Link>
        <Link to="/refund">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4" /> {t("pricing.refundPolicy")}
          </Button>
        </Link>
        {isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="w-full justify-start">
              <ShieldCheck className="h-4 w-4" /> {t("profile.admin")}
            </Button>
          </Link>
        )}
        <Button variant="outline" className="w-full justify-start text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" /> {t("profile.signOut")}
        </Button>
        <DeleteAccountDialog />
      </div>

      <p className="text-center text-xs text-muted-foreground">{user?.email}</p>
    </div>
  );
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon} <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}

export default Profile;
