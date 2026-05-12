import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { EXPERIENCE_LEVELS } from "@/lib/gamification";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const Trainings = () => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();

  const { data: trainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("*, categories(name, slug, icon, color_token)")
        .eq("is_published", true);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => trainings ?? [], [trainings]);

  const groups: { key: "aquecimento" | "fisico" | "tecnico" | "alongamento"; label: string; emoji: string; step: number }[] = [
    { key: "aquecimento", label: t("trainings.group.aquecimento"), emoji: "🔥", step: 1 },
    { key: "fisico", label: t("trainings.group.fisico"), emoji: "💪", step: 2 },
    { key: "tecnico", label: t("trainings.group.tecnico"), emoji: "⚽", step: 3 },
    { key: "alongamento", label: t("trainings.group.alongamento"), emoji: "🧘", step: 4 },
  ];

  return (
    <div className="space-y-5 px-5 pt-16 pb-10">
      <header className="pt-4">
        <h1 className="font-display text-3xl">{t("trainings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("trainings.subtitle")}</p>
      </header>

      {/* Levels — navigate to dedicated level page */}
      <div className="flex flex-wrap gap-2">
        {EXPERIENCE_LEVELS.map((l) => (
          <Link
            key={l.value}
            to={`/trainings/level/${l.value}`}
            className={cn(
              "flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              "border-border bg-muted/40 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
            )}
          >
            {t(`level.${l.value}`)}
          </Link>
        ))}
      </div>

      {/* Grouped sections */}
      <div className="space-y-6">
        {groups.map((g) => {
          const items = filtered.filter((tr: any) => tr.training_group === g.key);

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

          const isOpen = !!openGroups[g.key];
          return (
            <section key={g.key} className="space-y-3">
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                className="group flex w-full items-center justify-between rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-4 transition hover:border-primary/40 hover:from-primary/15"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {g.emoji}
                  </span>
                  <h2 className="font-display text-lg">{g.label}</h2>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-primary transition" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                )}
              </button>
              {isOpen && (
                items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-5 text-center text-xs text-muted-foreground">
                    {t("trainings.emptyGroup")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((tr: any) => (
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
                )
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default Trainings;
