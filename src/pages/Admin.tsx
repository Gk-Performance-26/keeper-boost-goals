import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin, useAdminCount } from "@/hooks/useIsAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, ArrowLeft, Video, Crown, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: adminCount, isLoading: countLoading } = useAdminCount();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);
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
      <div className="space-y-5 px-5 pt-8">
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
      <div className="space-y-4 px-5 pt-8">
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

  return (
    <div className="space-y-5 px-5 pt-8 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        <Link to="/admin/trainings/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> {t("admin.new")}
          </Button>
        </Link>
      </header>

      <div className="space-y-3">
        {(trainings ?? []).map((tr: any) => (
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
        ))}
        {(trainings ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("admin.empty")}</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
