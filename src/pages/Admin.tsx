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

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: adminCount, isLoading: countLoading } = useAdminCount();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);

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

  // First-admin claim flow (only when no admins exist yet)
  if (!isAdmin && adminCount === 0) {
    const claim = async () => {
      setClaiming(true);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });
      setClaiming(false);
      if (error) {
        toast.error("Não foi possível tornar-te admin: " + error.message);
        return;
      }
      toast.success("És agora administrador 🛡️");
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["admin-count"] });
    };
    return (
      <div className="space-y-5 px-5 pt-8">
        <header>
          <h1 className="font-display text-3xl">Admin</h1>
          <p className="text-sm text-muted-foreground">Ainda não existe nenhum administrador.</p>
        </header>
        <Card className="gradient-card border-border/60">
          <CardContent className="space-y-3 p-5 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="text-sm">
              Como és o primeiro a entrar nesta área, podes reclamar o papel de administrador para ti.
            </p>
            <Button onClick={claim} disabled={claiming} className="w-full">
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
              Tornar-me administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 px-5 pt-8">
        <h1 className="font-display text-3xl">Admin</h1>
        <p className="text-sm text-muted-foreground">Não tens permissões para aceder a esta área.</p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const remove = async (id: string) => {
    if (!confirm("Apagar este treino?")) return;
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Treino apagado");
    refetch();
  };

  return (
    <div className="space-y-5 px-5 pt-8 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Admin</h1>
          <p className="text-sm text-muted-foreground">Gerir treinos e vídeos</p>
        </div>
        <Link to="/admin/trainings/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </Link>
      </header>

      <div className="space-y-3">
        {(trainings ?? []).map((t: any) => (
          <Card key={t.id} className="gradient-card border-border/60">
            <CardContent className="flex items-start gap-3 p-3">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-muted/40">
                <Video className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{t.title}</p>
                  {!t.is_published && (
                    <Badge variant="outline" className="text-[10px]">
                      rascunho
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.categories?.name ?? "—"} · {t.level} · {t.duration_minutes}min · {t.xp_reward} XP
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link to={`/admin/trainings/${t.id}`}>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 text-destructive"
                  onClick={() => remove(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(trainings ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Ainda não existem treinos. Cria o primeiro!
          </p>
        )}
      </div>
    </div>
  );
};

export default Admin;
