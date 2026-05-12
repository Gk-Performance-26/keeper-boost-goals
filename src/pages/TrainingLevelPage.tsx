import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { EXPERIENCE_LEVELS, ExperienceLevel } from "@/lib/gamification";

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

  return (
    <div className="space-y-5 px-5 pt-16 pb-10">
      <header className="flex items-center gap-3">
        <Link to="/trainings">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-display text-2xl capitalize">{t(`level.${level}`)}</h1>
      </header>

      {(trainings ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-6 text-center text-sm text-muted-foreground">
          {t("trainings.emptyGroup")}
        </p>
      ) : (
        <div className="space-y-3">
          {(trainings ?? []).map((tr: any) => (
            <TrainingCard
              key={tr.id}
              id={tr.id}
              title={tr.title}
              level={tr.level}
              duration={tr.duration_minutes}
              xp={tr.xp_reward}
              categoryName={tr.categories?.name}
              categoryIcon={tr.categories?.icon}
              categoryColorToken={tr.categories?.color_token}
              isPremium={tr.is_premium}
              locked={tr.is_premium && !hasSub}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingLevelPage;
