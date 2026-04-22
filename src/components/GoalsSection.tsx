import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoalTemplates, useUserGoals, GoalTemplate } from "@/hooks/useGoals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { CheckCircle2, Plus, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { subDays, startOfDay, isAfter } from "date-fns";

type Session = { completed_at: string; xp_earned: number; duration_minutes: number };

type Props = {
  sessions: Session[];
  totalXp: number;
  currentStreak: number;
};

function periodCutoff(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "daily":
      return startOfDay(now);
    case "weekly":
      return subDays(now, 7);
    case "monthly":
      return subDays(now, 30);
    default:
      return null;
  }
}

function computeProgress(
  template: GoalTemplate,
  sessions: Session[],
  totalXp: number,
  currentStreak: number,
): number {
  const cutoff = periodCutoff(template.period);
  const filtered = cutoff
    ? sessions.filter((s) => isAfter(new Date(s.completed_at), cutoff))
    : sessions;

  switch (template.metric_type) {
    case "sessions":
      return filtered.length;
    case "xp":
      return cutoff
        ? filtered.reduce((sum, s) => sum + (s.xp_earned || 0), 0)
        : totalXp;
    case "minutes":
      return filtered.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    case "streak":
      return currentStreak;
    default:
      return 0;
  }
}

export function GoalsSection({ sessions, totalXp, currentStreak }: Props) {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { data: templates } = useGoalTemplates();
  const { data: userGoals } = useUserGoals();

  const [createOpen, setCreateOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const activeTemplateIds = useMemo(
    () => new Set((userGoals ?? []).map((g) => g.template_id)),
    [userGoals],
  );

  const availableTemplates = useMemo(
    () => (templates ?? []).filter((t) => t.is_active && !activeTemplateIds.has(t.id)),
    [templates, activeTemplateIds],
  );

  const activateGoal = async (template: GoalTemplate) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_goals")
      .insert({ user_id: user.id, template_id: template.id });
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(t("goals.activated"));
    qc.invalidateQueries({ queryKey: ["user-goals"] });
    setPickOpen(false);
  };

  const removeGoal = async (id: string) => {
    const { error } = await supabase.from("user_goals").delete().eq("id", id);
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(t("goals.removed"));
    qc.invalidateQueries({ queryKey: ["user-goals"] });
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm(t("goals.deleteConfirm"))) return;
    const { error } = await supabase.from("goal_templates").delete().eq("id", id);
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(t("goals.deleted"));
    qc.invalidateQueries({ queryKey: ["goal-templates"] });
    qc.invalidateQueries({ queryKey: ["user-goals"] });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t("goals.title")}
        </h2>
        <div className="flex gap-2">
          {availableTemplates.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setPickOpen(true)}>
              <Plus className="h-4 w-4" /> {t("goals.add")}
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> {t("goals.new")}
            </Button>
          )}
        </div>
      </div>

      {/* User active goals */}
      <div className="space-y-2">
        {(userGoals ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            {(templates ?? []).length === 0 && isAdmin
              ? t("goals.adminEmpty")
              : t("goals.empty")}
          </p>
        )}
        {(userGoals ?? []).map((g) => {
          if (!g.template) return null;
          const current = computeProgress(g.template, sessions, totalXp, currentStreak);
          const target = g.template.target_value;
          const pct = Math.min(100, Math.round((current / target) * 100));
          const done = current >= target;
          return (
            <Card key={g.id} className="gradient-card border-border/60">
              <CardContent className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-semibold text-sm">{g.template.title}</p>
                      {done && (
                        <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("goals.completed")}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {t(`goals.period.${g.template.period}`)}
                      </Badge>
                    </div>
                    {g.template.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{g.template.description}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => removeGoal(g.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <ProgressBar value={pct} className="h-2" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {current} / {target} {t(`goals.metric.${g.template.metric_type}`).toLowerCase()}
                    </span>
                    <span>{pct}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Picker dialog */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("goals.available")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {availableTemplates.map((tpl) => (
              <Card key={tpl.id} className="border-border/60">
                <CardContent className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{tpl.title}</p>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {tpl.target_value} {t(`goals.metric.${tpl.metric_type}`).toLowerCase()} ·{" "}
                      {t(`goals.period.${tpl.period}`)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" onClick={() => activateGoal(tpl)}>
                      {t("goals.activate")}
                    </Button>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteTemplate(tpl.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin create dialog */}
      {isAdmin && (
        <CreateGoalDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </section>
  );
}

function CreateGoalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("sessions");
  const [target, setTarget] = useState(10);
  const [period, setPeriod] = useState("weekly");
  const [xpReward, setXpReward] = useState(0);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setMetric("sessions");
    setTarget(10);
    setPeriod("weekly");
    setXpReward(0);
  };

  const submit = async () => {
    if (!title.trim()) {
      toast.error(t("goals.titleField"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("goal_templates").insert({
      title: title.trim(),
      description: description.trim() || null,
      metric_type: metric,
      target_value: Math.max(1, Number(target) || 1),
      period,
      xp_reward: Math.max(0, Number(xpReward) || 0),
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(t("common.error") + ": " + error.message);
      return;
    }
    toast.success(t("goals.created"));
    qc.invalidateQueries({ queryKey: ["goal-templates"] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("goals.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("goals.titleField")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("goals.titlePlaceholder")}
              maxLength={120}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("goals.descField")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("goals.descPlaceholder")}
              maxLength={400}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("goals.metric")}</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sessions">{t("goals.metric.sessions")}</SelectItem>
                  <SelectItem value="xp">{t("goals.metric.xp")}</SelectItem>
                  <SelectItem value="minutes">{t("goals.metric.minutes")}</SelectItem>
                  <SelectItem value="streak">{t("goals.metric.streak")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("goals.period")}</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("goals.period.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("goals.period.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("goals.period.monthly")}</SelectItem>
                  <SelectItem value="all_time">{t("goals.period.all_time")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("goals.target")}</Label>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("goals.xpReward")}</Label>
              <Input
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {t("goals.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
