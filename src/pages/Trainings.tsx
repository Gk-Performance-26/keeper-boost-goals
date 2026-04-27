import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

const Trainings = () => {
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();

  const { data: trainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("id, title, duration_minutes, training_group, is_premium, is_published")
        .eq("is_published", true);
      return data ?? [];
    },
  });

  const groups: { key: "fisico" | "tecnico" | "aquecimento" | "alongamento"; label: string; emoji: string }[] = [
    { key: "fisico", label: t("trainings.group.fisico"), emoji: "💪" },
    { key: "tecnico", label: t("trainings.group.tecnico"), emoji: "⚽" },
    { key: "aquecimento", label: t("trainings.group.aquecimento"), emoji: "🔥" },
    { key: "alongamento", label: t("trainings.group.alongamento"), emoji: "🧘" },
  ];

  return (
    <div className="space-y-5 px-5 pt-8 pb-10">
      <header>
        <h1 className="font-display text-3xl">{t("trainings.title")}</h1>
      </header>

      <div className="space-y-6">
        {groups.map((g) => {
          const items = (trainings ?? []).filter((tr) => (tr as any).training_group === g.key);

          // Aquecimento and Alongamentos: clickable card to dedicated sub-group page
          if (g.key === "aquecimento" || g.key === "alongamento") {
            return (
              <Link
                key={g.key}
                to={`/trainings/group/${g.key}`}
                className="group flex items-center justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-4 transition hover:border-primary/40 hover:from-primary/15"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {g.emoji}
                  </span>
                  <h2 className="font-display text-lg">{g.label}</h2>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            );
          }

          return (
            <section key={g.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {g.emoji}
                </span>
                <h2 className="font-display text-lg">{g.label}</h2>
              </div>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-5 text-center text-xs text-muted-foreground">
                  {t("trainings.emptyGroup")}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((tr: any) => (
                    <TrainingCard
                      key={tr.id}
                      id={tr.id}
                      title={tr.title}
                      duration={tr.duration_minutes}
                      isPremium={tr.is_premium}
                      locked={tr.is_premium && !hasSub}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Trainings;
