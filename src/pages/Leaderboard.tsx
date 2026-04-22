import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import leaderboardBg from "@/assets/leaderboard-bg.jpg";

const Leaderboard = () => {
  const { user } = useAuth();
  const [scope, setScope] = useState<"global" | "level">("global");
  const { t } = useLanguage();

  const { data: me } = useQuery({
    queryKey: ["me-profile-min", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("experience_level")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: rows } = useQuery({
    queryKey: ["leaderboard", scope, me?.experience_level],
    enabled: scope === "global" || !!me,
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, total_xp, current_streak, current_level, experience_level")
        .order("total_xp", { ascending: false })
        .limit(50);
      if (scope === "level" && me) q = q.eq("experience_level", me.experience_level);
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="relative space-y-5 px-5 pt-8 pb-6">
      {/* Background image */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-contain bg-no-repeat opacity-60 brightness-125"
        style={{
          backgroundImage: `url(${leaderboardBg})`,
          backgroundPosition: "center bottom",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/30 to-background/70"
      />
      <header>
        <h1 className="font-display text-3xl">{t("leaderboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("leaderboard.subtitle")}</p>
      </header>

      <div className="flex rounded-xl bg-muted p-1">
        {(["global", "level"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition",
              scope === s ? "bg-card shadow" : "text-muted-foreground",
            )}
          >
            {s === "global" ? t("leaderboard.global") : t("leaderboard.myLevel")}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(rows ?? []).map((r, i) => {
          const isMe = r.user_id === user?.id;
          return (
            <Card
              key={r.user_id}
              className={cn(
                "border-border/60",
                isMe ? "border-primary/60 bg-primary/10 shadow-glow" : "gradient-card",
              )}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 items-center justify-center font-display text-base font-bold">
                  {i === 0 ? (
                    <Crown className="h-5 w-5 text-secondary" />
                  ) : (
                    <span className="text-muted-foreground">#{i + 1}</span>
                  )}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={r.avatar_url ?? undefined} />
                  <AvatarFallback>{(r.display_name ?? "?").slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {r.display_name ?? t("profile.fallbackName")}{" "}
                    {isMe && <span className="text-xs text-primary">{t("leaderboard.you")}</span>}
                  </p>
                  <p className="text-[11px] capitalize text-muted-foreground">
                    {t("leaderboard.lvShort")} {r.current_level} · {t(`level.${r.experience_level}`)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1 font-display text-sm font-bold text-primary">
                    <Trophy className="h-3 w-3" /> {r.total_xp}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-secondary">
                    <Flame className="h-3 w-3" /> {r.current_streak}d
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(rows ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("leaderboard.empty")}</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
