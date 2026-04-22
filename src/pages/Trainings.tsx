import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EXPERIENCE_LEVELS, ExperienceLevel } from "@/lib/gamification";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const Trainings = () => {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const { isActive: hasSub } = useSubscription();

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

  const filtered = useMemo(() => {
    return (trainings ?? []).filter((t) => {
      if (categorySlug && t.categories?.slug !== categorySlug) return false;
      if (level && t.level !== level) return false;
      return true;
    });
  }, [trainings, categorySlug, level]);

  return (
    <div className="space-y-5 px-5 pt-8">
      <header>
        <h1 className="font-display text-3xl">Training Library</h1>
        <p className="text-sm text-muted-foreground">Find your next session</p>
      </header>

      {/* Categories */}
      <div className="-mx-5 overflow-x-auto">
        <div className="flex gap-2 px-5 pb-1">
          <FilterChip active={!categorySlug} onClick={() => setCategorySlug(null)}>
            All
          </FilterChip>
          {(categories ?? []).map((c) => (
            <FilterChip
              key={c.id}
              active={categorySlug === c.slug}
              onClick={() => setCategorySlug(categorySlug === c.slug ? null : c.slug)}
              colorToken={c.color_token}
            >
              <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
              {c.name}
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
            {l.label}
          </FilterChip>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <TrainingCard
            key={t.id}
            id={t.id}
            title={t.title}
            level={t.level}
            duration={t.duration_minutes}
            xp={t.xp_reward}
            categoryName={t.categories?.name}
            categoryIcon={t.categories?.icon}
            categoryColorToken={t.categories?.color_token}
            isPremium={(t as any).is_premium}
            locked={(t as any).is_premium && !hasSub}
          />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No sessions match those filters.</p>
        )}
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
