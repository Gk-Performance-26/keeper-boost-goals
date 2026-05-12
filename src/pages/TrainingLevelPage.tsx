import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { EXPERIENCE_LEVELS, ExperienceLevel } from "@/lib/gamification";

const GROUP_ORDER: { key: "aquecimento" | "fisico" | "tecnico"; emoji: string; step: number }[] = [
  { key: "aquecimento", emoji: "🔥", step: 1 },
  { key: "fisico", emoji: "💪", step: 2 },
  { key: "tecnico", emoji: "⚽", step: 3 },
];

const TrainingLevelPage = () => {
  const { level } = useParams<{ level: ExperienceLevel }>();
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();

  const valid = EXPERIENCE_LEVELS.some((l) => l.value === level);
  if (!level || !valid) return <Navigate to="/trainings" replace />;

  const { data: trainings } = useQuery({
    queryKey: ["trainings-level", level],
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("*, categories(name, slug, icon, color_token)")
        .eq("is_published", true)
        .eq("level", level);
      return data ?? [];
    },
  });

  const pickOnePerGroup = GROUP_ORDER.map((g) => {
    const item = (trainings ?? []).find((tr: any) => tr.training_group === g.key);
    return { ...g, item };
  });

  return (
    <div className="space-y-6 px-5 pt-16 pb-10">
      <header className="flex items-center gap-3">
        <Link to="/trainings">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-2xl capitalize">{t(`level.${level}`)}</h1>
      </header>

      <div className="space-y-5">
        {pickOnePerGroup.map((g) => (
          <section key={g.key} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary">
                {g.step}
              </span>
              <span className="text-2xl" aria-hidden>
                {g.emoji}
              </span>
              <h2 className="font-display text-lg">{t(`trainings.group.${g.key}`)}</h2>
            </div>
            {g.item ? (
              <TrainingCard
                id={g.item.id}
                title={g.item.title}
                level={g.item.level}
                duration={g.item.duration_minutes}
                xp={g.item.xp_reward}
                categoryName={g.item.categories?.name}
                categoryIcon={g.item.categories?.icon}
                categoryColorToken={g.item.categories?.color_token}
                isPremium={g.item.is_premium}
                locked={g.item.is_premium && !hasSub}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-4 text-center text-xs text-muted-foreground">
                {t("trainings.emptyGroup")}
              </p>
            )}
          </section>
        ))}
      </div>

      <Link to="/trainings" className="block">
        <Button className="w-full" size="lg">
          Ver mais treinos
        </Button>
      </Link>
    </div>
  );
};

export default TrainingLevelPage;
