import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInvalidateProfile, useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AGE_GROUPS,
  DOMINANT_HANDS,
  EXPERIENCE_LEVELS,
  ExperienceLevel,
  PLAYING_STYLES,
  PlayingStyle,
} from "@/lib/gamification";
import { Check, ChevronRight, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const TOTAL_STEPS = 5;

const Onboarding = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidate = useInvalidateProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<ExperienceLevel>(profile?.experience_level || "beginner");
  const [age, setAge] = useState<string>(profile?.age_group || "Senior");
  const [hand, setHand] = useState<"left" | "right" | "both">(
    (profile?.dominant_hand as "left" | "right" | "both") || "right",
  );
  const [styles, setStyles] = useState<PlayingStyle[]>(
    ((profile as unknown as { playing_styles?: PlayingStyle[] })?.playing_styles ?? []) as PlayingStyle[],
  );
  const [goal, setGoal] = useState(profile?.training_goal || "");
  const [saving, setSaving] = useState(false);

  const toggleStyle = (value: PlayingStyle) => {
    setStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const canContinue = () => {
    if (step === 3) return styles.length > 0;
    return true;
  };

  const finish = async () => {
    if (!user) return;
    if (styles.length === 0) {
      toast({
        title: t("onb.styleRequired"),
        description: t("onb.styleRequiredDesc"),
        variant: "destructive",
      });
      setStep(3);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        experience_level: level,
        age_group: age,
        dominant_hand: hand,
        training_goal: goal || null,
        onboarded: true,
        ...({ playing_styles: styles } as Record<string, unknown>),
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: t("onb.couldNotSave"), description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
    toast({ title: t("onb.allSet"), description: t("onb.allSetDesc") });
    navigate("/");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("onb.stepOf", { current: step + 1, total: TOTAL_STEPS })}
          </p>
          <h2 className="font-display text-xl">{t("onb.setupKit")}</h2>
        </div>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full gradient-primary transition-all"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <Card className="gradient-card border-border/60 shadow-card">
        <CardContent className="space-y-5 p-6">
          {step === 0 && (
            <>
              <h3 className="font-display text-2xl">{t("onb.levelTitle")}</h3>
              <div className="grid gap-2">
                {EXPERIENCE_LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 text-left transition",
                      level === l.value
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    <span className="font-semibold">{t(`level.${l.value}`)}</span>
                    {level === l.value && <ChevronRight className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="font-display text-2xl">{t("onb.ageTitle")}</h3>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={cn(
                      "rounded-xl border p-3 font-semibold transition",
                      age === a
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-display text-2xl">{t("onb.handTitle")}</h3>
              <div className="grid grid-cols-3 gap-2">
                {DOMINANT_HANDS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setHand(h.value)}
                    className={cn(
                      "rounded-xl border p-4 font-semibold transition",
                      hand === h.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    {t(`hand.${h.value}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="font-display text-2xl">{t("onb.styleTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("onb.styleHelp")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PLAYING_STYLES.map((s) => {
                  const active = styles.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleStyle(s.value)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-left text-sm font-semibold transition",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-glow"
                          : "border-border bg-muted/30 hover:bg-muted/60",
                      )}
                    >
                      <span>{t(`style.${s.value}`)}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              {styles.length === 0 && (
                <p className="text-xs text-destructive">{t("onb.stylePickAtLeastOne")}</p>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="font-display text-2xl">{t("onb.goalTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("onb.goalHelp")}</p>
              <div className="space-y-1.5">
                <Label htmlFor="goal">{t("onb.goalLabel")}</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t("onb.goalPlaceholder")}
                  maxLength={120}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            {t("onb.back")}
          </Button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <Button
            className="flex-1 shadow-glow"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
          >
            {t("onb.continue")}
          </Button>
        ) : (
          <Button className="flex-1 shadow-glow" onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("onb.start")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
