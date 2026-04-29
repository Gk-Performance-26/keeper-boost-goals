import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBar } from "@/components/LevelBar";
import { Crown, FileText, Flame, Loader2, LogOut, MessageSquare, RotateCw, Settings, Shield, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { isActive: hasSub, hasPaidSub, refetch: refetchSub } = useSubscription();
  const { t } = useLanguage();
  const [restoring, setRestoring] = useState(false);

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      await refetchSub();
      toast.success(t("profile.restoreSuccess"));
    } catch (e) {
      toast.error(t("profile.restoreError") + (e instanceof Error ? e.message : ""));
    } finally {
      setRestoring(false);
    }
  };

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
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display text-2xl">{profile.display_name ?? t("profile.fallbackName")}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {t(`level.${profile.experience_level}`)} · {profile.age_group ?? "—"}
          </p>
          {hasSub ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Crown className="h-3 w-3" /> {t("trainings.premium")}
            </span>
          ) : (
            <Link to="/subscription" className="mt-1">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow hover:from-primary/90 hover:to-primary/70 px-6"
              >
                <Crown className="h-4 w-4" />
                {t("profile.becomePremium")}
              </Button>
            </Link>
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
        {hasSub && (
          <Link to="/subscription">
            <Button variant="outline" className="w-full justify-start">
              <Crown className="h-4 w-4" />
              {t("profile.managePremium")}
            </Button>
          </Link>
        )}
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
