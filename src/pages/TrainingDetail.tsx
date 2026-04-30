import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Clock, Crown, Loader2, Lock, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { cn } from "@/lib/utils";

type VideoSrc = "upload" | "youtube" | "vimeo";

interface Drill {
  title: string;
  reps: string;
  is_premium?: boolean;
  intro_video_url?: string | null;
  intro_video_type?: VideoSrc | null;
  exercise_video_url?: string | null;
  exercise_video_type?: VideoSrc | null;
}

const TrainingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();
  const [done, setDone] = useState<Set<number>>(new Set());
  const [openDrill, setOpenDrill] = useState<number | null>(null);

  const { data: training, isLoading } = useQuery({
    queryKey: ["training", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*, categories(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const drills = ((training?.drills as unknown as Drill[]) || []);
  const equipmentList = (training?.equipment ?? []) as string[];
  const baseTexts = [
    training?.title ?? "",
    training?.description ?? "",
    training?.categories?.name ?? "",
    ...drills.map((d) => d.title ?? ""),
    ...drills.map((d) => d.reps ?? ""),
    ...equipmentList,
  ];
  const translated = useTranslatedTexts(baseTexts);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!training) return <p className="p-8 text-center">{t("common.notFound")}</p>;

  const accessibleDrills = drills
    .map((d, i) => ({ ...d, _idx: i, _locked: !!d.is_premium && !hasSub }))
    .filter((d) => !d._locked);
  const lockedDrills = drills.filter((d) => d.is_premium && !hasSub);
  const allDone = accessibleDrills.length > 0 && done.size === accessibleDrills.length;
  const isLocked = (training as any).is_premium && !hasSub;

  const tTitle = translated[0] || training.title;
  const tDesc = translated[1] || training.description;
  const tCategory = translated[2] || training.categories?.name;
  const tDrillTitles = translated.slice(3, 3 + drills.length);
  const tDrillReps = translated.slice(3 + drills.length, 3 + drills.length * 2);
  const tEquipment = translated.slice(3 + drills.length * 2);

  const toggle = (i: number) => {
    setDone((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const accessibleIndices = accessibleDrills.map((d) => d._idx);
  const goToNextDrill = (currentIdx: number | null) => {
    const pos = currentIdx === null ? -1 : accessibleIndices.indexOf(currentIdx);
    const next = accessibleIndices[pos + 1];
    if (next !== undefined) {
      setOpenDrill(next);
      setTimeout(() => {
        document
          .getElementById(`drill-${next}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };
  const handleDrillEnded = (i: number) => {
    setDone((s) => {
      if (s.has(i)) return s;
      const n = new Set(s);
      n.add(i);
      return n;
    });
    goToNextDrill(i);
  };

  return (
    <div className="space-y-5 px-5 pt-6 pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      {isLocked ? (
        <Card className="gradient-card border-primary/40 shadow-glow">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("training.premiumContent")}</p>
              <h2 className="font-display text-xl">{t("training.unlock")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("training.subscribeCta")}</p>
            </div>
            <Link to="/subscription" className="w-full">
              <Button size="lg" className="w-full shadow-glow">
                <Crown className="h-4 w-4" /> {t("training.becomePremium")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <VideoPlayer
          trainingId={training.id}
          url={training.video_url}
          type={training.video_type}
          introUrl={(training as any).intro_video_url}
          introType={(training as any).intro_video_type}
          introLabel={t("training.introVideo")}
          exerciseLabel={t("training.exerciseVideo")}
          onAllEnded={() => goToNextDrill(null)}
        />
      )}

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {training.categories && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `hsl(var(--${training.categories.color_token}) / 0.18)`,
                color: `hsl(var(--${training.categories.color_token}))`,
              }}
            >
              <CategoryIcon name={training.categories.icon} className="h-3 w-3" />
              {tCategory}
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{t(`level.${training.level}`)}</span>
        </div>
        <h1 className="font-display text-2xl">{tTitle}</h1>
        <p className="text-sm text-muted-foreground">{tDesc}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" /> {training.duration_minutes} {t("common.minutesShort")}
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="h-4 w-4" /> {training.xp_reward} XP
          </span>
        </div>
      </header>

      {training.equipment && training.equipment.length > 0 && (
        <Card className="gradient-card border-border/60">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("training.equipment")}</p>
            <div className="flex flex-wrap gap-1.5">
              {training.equipment.map((e, idx) => (
                <span key={e} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {tEquipment[idx] || e}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLocked && (
        <>
          <section className="space-y-2">
            <h2 className="font-display text-lg">{t("training.drills")}</h2>
            <div className="space-y-2">
              {drills.map((d, i) => {
                const drillLocked = !!d.is_premium && !hasSub;
                if (drillLocked) {
                  return (
                    <Link
                      key={i}
                      to="/subscription"
                      className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-left transition hover:border-primary/60 hover:bg-primary/10"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold opacity-80">{tDrillTitles[i] || d.title}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            <Crown className="h-2.5 w-2.5" /> {t("trainings.premium")}
                          </span>
                        </div>
                        <p className="text-xs text-primary">{t("training.subscribeToUnlock")}</p>
                      </div>
                    </Link>
                  );
                }
                const hasDrillVideo = !!d.exercise_video_url || !!d.intro_video_url;
                const isOpen = openDrill === i;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border transition",
                      done.has(i)
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-muted/30",
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        className={cn(
                          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition",
                          done.has(i) ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                        aria-label={done.has(i) ? t("training.markUndone") : t("training.markDone")}
                      >
                        {done.has(i) && <Check className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => hasDrillVideo ? setOpenDrill(isOpen ? null : i) : toggle(i)}
                        className="flex-1 text-left"
                      >
                        <p className={cn("font-semibold", done.has(i) && "line-through opacity-70")}>{tDrillTitles[i] || d.title}</p>
                        <p className="text-xs text-muted-foreground">{tDrillReps[i] || d.reps}</p>
                      </button>
                      {hasDrillVideo && (
                        <button
                          type="button"
                          onClick={() => setOpenDrill(isOpen ? null : i)}
                          className="flex-shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25"
                        >
                          {isOpen ? t("training.hideVideo") : t("training.watchDrill")}
                        </button>
                      )}
                    </div>
                    {isOpen && hasDrillVideo && (
                      <div className="px-3 pb-3">
                        <VideoPlayer
                          trainingId={training.id}
                          drillIndex={i}
                          mainField="drill_exercise"
                          introField="drill_intro"
                          url={d.exercise_video_url || d.intro_video_url || ""}
                          type={(d.exercise_video_type || d.intro_video_type || "upload") as VideoSrc}
                          introUrl={d.intro_video_url}
                          introType={d.intro_video_type}
                          introLabel={t("training.introVideo")}
                          exerciseLabel={t("training.exerciseVideo")}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {lockedDrills.length > 0 && (
              <p className="pt-1 text-center text-[11px] text-muted-foreground">
                {lockedDrills.length} {t("training.lockedDrills")}
              </p>
            )}
          </section>

          <Link to={`/trainings/${training.id}/complete`}>
            <Button size="lg" disabled={!allDone} className="w-full shadow-glow">
              {allDone
                ? t("training.finish")
                : `${t("training.tickAll")} (${done.size}/${accessibleDrills.length})`}
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default TrainingDetail;
