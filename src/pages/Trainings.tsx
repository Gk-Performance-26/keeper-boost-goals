import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EXPERIENCE_LEVELS, ExperienceLevel } from "@/lib/gamification";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { cn } from "@/lib/utils";

const Trainings = () => {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

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

  const { data: warmupSubs } = useQuery({
    queryKey: ["warmup-subcategories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("warmup_subcategories")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: stretchingSubs } = useQuery({
    queryKey: ["stretching-subcategories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stretching_subcategories")
        .select("*")
        .order("sort_order");
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (trainings ?? []).filter((tr) => {
      if (categorySlug && tr.categories?.slug !== categorySlug) return false;
      if (level && tr.level !== level) return false;
      return true;
    });
  }, [trainings, categorySlug, level]);

  const groups: { key: "fisico" | "tecnico" | "aquecimento" | "alongamento"; label: string }[] = [
    { key: "fisico", label: t("trainings.group.fisico") },
    { key: "tecnico", label: t("trainings.group.tecnico") },
    { key: "aquecimento", label: t("trainings.group.aquecimento") },
    { key: "alongamento", label: t("trainings.group.alongamento") },
  ];

  const translatedCategoryNames = useTranslatedTexts((categories ?? []).map((c) => c.name));

  return (
    <div className="space-y-5 px-5 pt-8">
      <header>
        <h1 className="font-display text-3xl">{t("trainings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("trainings.subtitle")}</p>
      </header>

      {/* Categories */}
      <div className="-mx-5 overflow-x-auto">
        <div className="flex gap-2 px-5 pb-1">
          <FilterChip active={!categorySlug} onClick={() => setCategorySlug(null)}>
            {t("common.all")}
          </FilterChip>
          {(categories ?? []).map((c, idx) => (
            <FilterChip
              key={c.id}
              active={categorySlug === c.slug}
              onClick={() => setCategorySlug(categorySlug === c.slug ? null : c.slug)}
              colorToken={c.color_token}
            >
              <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
              {translatedCategoryNames[idx] || c.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div className="flex flex-wrap gap-2">
        {EXPERIENCE_LEVELS.map((l) => (
          <FilterChip
            key={l.value}
            active={level === l.value}
            onClick={() => setLevel(level === l.value ? null : l.value)}
          >
            {t(`level.${l.value}`)}
          </FilterChip>
        ))}
      </div>

      {/* Grouped sections */}
      <div className="space-y-8">
        {groups.map((g) => {
          const items = filtered.filter((tr) => (tr as any).training_group === g.key);

          // Special rendering for warmup: split into Geral / GK with subcategory blocks
          if (g.key === "aquecimento") {
            const subs = warmupSubs ?? [];
            const subsGeral = subs.filter((s) => s.parent === "geral");
            const subsGk = subs.filter((s) => s.parent === "gk");
            const renderTrainingCard = (tr: any) => (
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
            );

            const renderSubBlock = (sub: any) => {
              const subItems = items.filter((tr) => (tr as any).warmup_subcategory_id === sub.id);
              return (
                <div key={sub.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={sub.icon} className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">{sub.name}</h4>
                    <span className="ml-auto text-[11px] text-muted-foreground">{subItems.length}</span>
                  </div>
                  {subItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 py-3 text-center text-[11px] text-muted-foreground">
                      {t("trainings.emptyGroup")}
                    </p>
                  ) : (
                    <div className="space-y-2">{subItems.map(renderTrainingCard)}</div>
                  )}
                </div>
              );
            };

            return (
              <section key={g.key} className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl">{g.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
                  <h3 className="font-display text-base">Aquecimento Geral</h3>
                  <div className="space-y-4">{subsGeral.map(renderSubBlock)}</div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
                  <h3 className="font-display text-base">Aquecimento Específico GK</h3>
                  <div className="space-y-4">{subsGk.map(renderSubBlock)}</div>
                </div>
              </section>
            );
          }

          return (
            <section key={g.key} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl">{g.label}</h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-6 text-center text-xs text-muted-foreground">
                  {t("trainings.emptyGroup")}
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((tr) => (
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
                      isPremium={(tr as any).is_premium}
                      locked={(tr as any).is_premium && !hasSub}
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

function FilterChip({
  children,
  active,
  onClick,
  colorToken,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  colorToken?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
      style={
        active && colorToken
          ? {
              borderColor: `hsl(var(--${colorToken}))`,
              backgroundColor: `hsl(var(--${colorToken}) / 0.18)`,
              color: `hsl(var(--${colorToken}))`,
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

export default Trainings;
