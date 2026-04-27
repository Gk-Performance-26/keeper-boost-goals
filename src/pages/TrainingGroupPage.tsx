import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

type GroupKey = "aquecimento" | "alongamento";

const GROUP_CONFIG: Record<
  GroupKey,
  {
    title: string;
    emoji: string;
    subTable: "warmup_subcategories" | "stretching_subcategories";
    subFk: "warmup_subcategory_id" | "stretching_subcategory_id";
    parents: { value: string; label: string }[];
  }
> = {
  aquecimento: {
    title: "Aquecimento",
    emoji: "🔥",
    subTable: "warmup_subcategories",
    subFk: "warmup_subcategory_id",
    parents: [
      { value: "geral", label: "Aquecimento Geral" },
      { value: "gk", label: "Aquecimento Específico GK" },
    ],
  },
  alongamento: {
    title: "Alongamentos",
    emoji: "🧘",
    subTable: "stretching_subcategories",
    subFk: "stretching_subcategory_id",
    parents: [
      { value: "alongamentos", label: "Alongamentos" },
      { value: "recuperacao", label: "Recuperação & Prevenção" },
    ],
  },
};

const TrainingGroupPage = () => {
  const { group } = useParams<{ group: GroupKey }>();
  const { isActive: hasSub } = useSubscription();
  const { t } = useLanguage();

  if (!group || !(group in GROUP_CONFIG)) {
    return <Navigate to="/trainings" replace />;
  }

  const config = GROUP_CONFIG[group as GroupKey];

  const { data: subs } = useQuery({
    queryKey: [config.subTable],
    queryFn: async () => {
      const { data } = await supabase.from(config.subTable).select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: trainings } = useQuery({
    queryKey: ["trainings-group", group],
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("*, categories(name, slug, icon, color_token)")
        .eq("is_published", true)
        .eq("training_group", group);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-5 px-5 pt-8 pb-10">
      <header className="flex items-center gap-3">
        <Link to="/trainings">
          <Button size="icon" variant="ghost">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl">
            {config.emoji} {config.title}
          </h1>
          <p className="text-xs text-muted-foreground">{(trainings ?? []).length} treinos</p>
        </div>
      </header>

      <div className="space-y-5">
        {config.parents.map((parent) => {
          const parentSubs = (subs ?? []).filter((s: any) => s.parent === parent.value);
          return (
            <div
              key={parent.value}
              className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4"
            >
              <h2 className="font-display text-base">{parent.label}</h2>
              <div className="space-y-4">
                {parentSubs.map((sub: any) => {
                  const subItems = (trainings ?? []).filter(
                    (tr: any) => tr[config.subFk] === sub.id,
                  );
                  return (
                    <div key={sub.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={sub.icon} className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">{sub.name}</h3>
                        <span className="ml-auto text-[11px] text-muted-foreground">
                          {subItems.length}
                        </span>
                      </div>
                      {subItems.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 py-3 text-center text-[11px] text-muted-foreground">
                          {t("trainings.emptyGroup")}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {subItems.map((tr: any) => (
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingGroupPage;
