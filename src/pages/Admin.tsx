import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminCount } from "@/hooks/useIsAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, ArrowLeft, Video, Crown, Unlock, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: adminCount, isLoading: countLoading } = useAdminCount();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  const { data: trainings, refetch } = useQuery({
    queryKey: ["admin-trainings"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*, categories(name, color_token)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!user) return <Navigate to="/auth" replace />;
  if (isLoading || countLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && adminCount === 0) {
    const claim = async () => {
      setClaiming(true);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });
      setClaiming(false);
      if (error) {
        toast.error(t("admin.claimError") + error.message);
        return;
      }
      toast.success(t("admin.claimed"));
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["admin-count"] });
    };
    return (
      <div className="space-y-5 px-5 pt-16">
        <header>
          <h1 className="font-display text-3xl">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.noAdminsYet")}</p>
        </header>
        <Card className="gradient-card border-border/60">
          <CardContent className="space-y-3 p-5 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="text-sm">{t("admin.claimText")}</p>
            <Button onClick={claim} disabled={claiming} className="w-full">
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("admin.claimBtn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 px-5 pt-16">
        <h1 className="font-display text-3xl">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.noPermission")}</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  const remove = async (id: string) => {
    if (!confirm(t("admin.deleteConfirm"))) return;
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(t("admin.deleted"));
    refetch();
  };

  const togglePremium = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("trainings")
      .update({ is_premium: !currentValue })
      .eq("id", id);
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(!currentValue ? t("admin.madePremium") : t("admin.madeFree"));
    refetch();
  };

  const groups: { key: "aquecimento" | "fisico" | "tecnico" | "alongamento"; label: string; emoji: string }[] = [
    { key: "aquecimento", label: t("trainings.group.aquecimento"), emoji: "🔥" },
    { key: "fisico", label: t("trainings.group.fisico"), emoji: "💪" },
    { key: "tecnico", label: t("trainings.group.tecnico"), emoji: "⚽" },
    { key: "alongamento", label: t("trainings.group.alongamento"), emoji: "🧘" },
  ];

  const renderTraining = (tr: any) => (
    <Card key={tr.id} className="gradient-card border-border/60">
      <CardContent className="flex items-start gap-3 p-3">
        <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-muted/40">
          <Video className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{tr.title}</p>
            {tr.is_premium && (
              <Badge className="gap-1 bg-primary/15 text-primary border-primary/30 text-[10px]" variant="outline">
                <Crown className="h-3 w-3" /> {t("trainings.premium")}
              </Badge>
            )}
            {!tr.is_published && (
              <Badge variant="outline" className="text-[10px]">
                {t("admin.draft")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {tr.categories?.name ?? "—"} · {t(`level.${tr.level}`)} · {tr.duration_minutes}{t("common.minutesShort")} · {tr.xp_reward} XP
          </p>
          <Button
            size="sm"
            variant={tr.is_premium ? "outline" : "default"}
            className="mt-2 h-7 gap-1.5 text-xs"
            onClick={() => togglePremium(tr.id, tr.is_premium)}
          >
            {tr.is_premium ? (
              <>
                <Unlock className="h-3.5 w-3.5" /> {t("admin.makeFree")}
              </>
            ) : (
              <>
                <Crown className="h-3.5 w-3.5" /> {t("admin.makePremium")}
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Link to={`/admin/trainings/${tr.id}`}>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-destructive"
            onClick={() => remove(tr.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 px-5 pt-16 pb-6">
      <header>
        <h1 className="font-display text-3xl">{t("admin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
      </header>

      <Link to="/admin/trainings/new" className="block">
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> {t("admin.new")}
        </Button>
      </Link>

      {(trainings ?? []).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("admin.empty")}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const items = (trainings ?? []).filter((tr: any) => tr.training_group === g.key);
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
                    <span className="text-2xl" aria-hidden>{g.emoji}</span>
                    <h2 className="font-display text-lg">{g.label}</h2>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
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
                      {items.map(renderTraining)}
                    </div>
                  )
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Admin;
