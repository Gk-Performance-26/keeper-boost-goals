import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { pt as ptLocale, enUS } from "date-fns/locale";
import { LevelBar } from "@/components/LevelBar";
import { StreakBadge } from "@/components/StreakBadge";
import { Award, Flame, Sparkles, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoalsSection } from "@/components/GoalsSection";

const Progress = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { t, lang } = useLanguage();
  const dateLocale = lang === "pt" ? ptLocale : enUS;

  const { data: scores } = useQuery({
    queryKey: ["skill-scores", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("skill_scores")
        .select("score, category_id, recorded_at, categories(name, slug, color_token)")
        .eq("user_id", user!.id)
        .order("recorded_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("completed_sessions")
        .select("completed_at, xp_earned, duration_minutes")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: badges } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*");
      return data ?? [];
    },
  });

  const { data: userBadges } = useQuery({
    queryKey: ["user-badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_badges").select("badge_id").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  // radar (avg per category)
  const radarData = (() => {
    if (!scores) return [];
    const map = new Map<string, { name: string; total: number; count: number }>();
    scores.forEach((s) => {
      const name = s.categories?.name || "—";
      const e = map.get(name) || { name, total: 0, count: 0 };
      e.total += s.score;
      e.count += 1;
      map.set(name, e);
    });
    return Array.from(map.values()).map((e) => ({ category: e.name, score: e.total / e.count }));
  })();

  // streak heatmap (last 28 days)
  const days = Array.from({ length: 28 }).map((_, i) => subDays(new Date(), 27 - i));
  const trainedSet = new Set((sessions ?? []).map((s) => format(startOfDay(new Date(s.completed_at)), "yyyy-MM-dd")));

  const totalMinutes = (sessions ?? []).reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const earnedBadgeIds = new Set((userBadges ?? []).map((b) => b.badge_id));

  if (!profile) return null;

  return (
    <div className="space-y-5 px-5 pt-8 pb-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("progress.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("progress.subtitle")}</p>
        </div>
        <StreakBadge streak={profile.current_streak} />
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Sparkles className="h-4 w-4" />} label={t("progress.totalXp")} value={profile.total_xp.toLocaleString()} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label={t("progress.sessions")} value={(sessions?.length ?? 0).toString()} />
        <StatCard icon={<Flame className="h-4 w-4" />} label={t("progress.bestStreak")} value={`${profile.longest_streak}d`} />
        <StatCard icon={<Award className="h-4 w-4" />} label={t("progress.timeTrained")} value={`${totalMinutes}m`} />
      </div>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.level")}</p>
          <LevelBar totalXp={profile.total_xp} />
        </CardContent>
      </Card>

      {/* Goals (admin can create, users can activate) */}
      <GoalsSection
        sessions={sessions ?? []}
        totalXp={profile.total_xp}
        currentStreak={profile.current_streak}
      />

      {/* Streak heatmap */}
      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("progress.last4Weeks")}</p>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const trained = trainedSet.has(format(d, "yyyy-MM-dd"));
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={d.toISOString()}
                  className={`aspect-square rounded-md border ${
                    trained
                      ? "border-primary/40 bg-primary/70 shadow-glow"
                      : "border-border bg-muted/30"
                  } ${isToday ? "ring-2 ring-primary" : ""}`}
                  title={format(d, "PP", { locale: dateLocale })}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skill radar */}
      {radarData.length > 0 && (
        <Card className="gradient-card border-border/60">
          <CardContent className="p-3">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("progress.skillProfile")}
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <section className="space-y-2">
        <h2 className="font-display text-lg">{t("progress.badges")}</h2>
        <div className="grid grid-cols-3 gap-2">
          {(badges ?? []).map((b) => {
            const earned = earnedBadgeIds.has(b.id);
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                  earned ? "border-primary/40 bg-primary/10" : "border-border bg-muted/20 opacity-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    earned ? "shadow-glow" : ""
                  }`}
                  style={{ backgroundColor: `hsl(var(--${b.color_token}) / ${earned ? 0.3 : 0.1})` }}
                >
                  <Award
                    className="h-5 w-5"
                    style={{ color: `hsl(var(--${b.color_token}))` }}
                  />
                </div>
                <p className="text-[11px] font-semibold leading-tight">{b.name}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="gradient-card border-border/60">
      <CardContent className="space-y-1 p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {icon} {label}
        </div>
        <p className="font-display text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default Progress;
