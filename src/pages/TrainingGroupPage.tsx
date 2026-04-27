import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCard } from "@/components/TrainingCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

type GroupKey = "aquecimento" | "alongamento";

const GROUP_CONFIG: Record<
  GroupKey,
  {
    title: string;
    subTable: "warmup_subcategories" | "stretching_subcategories";
    subFk: "warmup_subcategory_id" | "stretching_subcategory_id";
    parents: { value: string; label: string }[];
  }
> = {
  aquecimento: {
    title: "Aquecimento",
    subTable: "warmup_subcategories",
    subFk: "warmup_subcategory_id",
    parents: [
      { value: "geral", label: "Geral" },
      { value: "gk", label: "Específico GK" },
    ],
  },
  alongamento: {
    title: "Alongamentos",
    subTable: "stretching_subcategories",
    subFk: "stretching_subcategory_id",
    parents: [
      { value: "alongamentos", label: "Alongamentos" },
      { value: "recuperacao", label: "Recuperação" },
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
        .select(`*, categories(name, slug, icon, color_token)`)
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
        <h1 className="font-display text-2xl">{config.title}</h1>
      </header>

      <div className="space-y-5">
        {config.parents.map((parent) => {
          const parentSubs = (subs ?? []).filter((s: any) => s.parent === parent.value);
          return (
            <div key={parent.value} className="space-y-3">
              <h2 className="font-display text-base text-muted-foreground">{parent.label}</h2>
              <div className="space-y-4">
                {parentSubs.map((sub: any) => {
                  const subItems = (trainings ?? []).filter(
                    (tr: any) => tr[config.subFk] === sub.id,
                  );
                  return (
                    <div key={sub.id} className="space-y-2">
                      <h3 className="text-sm font-semibold">{sub.name}</h3>
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
