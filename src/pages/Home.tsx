import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { LevelBar } from "@/components/LevelBar";
import { StreakBadge } from "@/components/StreakBadge";
import { XpRing } from "@/components/XpRing";
import { TrainingCard } from "@/components/TrainingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Sparkles, Trophy } from "lucide-react";
import { format, startOfDay } from "date-fns";
import gkLogo from "@/assets/gk-logo.jpg";
import { useSubscription } from "@/hooks/useSubscription";

const Home = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { isActive: hasSub } = useSubscription();

  const { data: recommended } = useQuery({
    queryKey: ["recommended", profile?.experience_level],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("*, categories(name, icon, color_token, slug)")
        .eq("level", profile!.experience_level)
        .limit(3);
      return data ?? [];
    },
  });

  const today = startOfDay(new Date()).toISOString();
  const { data: todayXp } = useQuery({
    queryKey: ["todayXp", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("completed_sessions")
        .select("xp_earned")
        .eq("user_id", user!.id)
        .gte("completed_at", today);
      return (data ?? []).reduce((sum, s) => sum + (s.xp_earned || 0), 0);
    },
  });

  const { data: challenge } = useQuery({
    queryKey: ["weekly-challenge"],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_challenges")
        .select("*, categories(name, icon, color_token)")
        .lte("week_start", new Date().toISOString().slice(0, 10))
        .gte("week_end", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      return data;
    },
  });

  if (!profile) return null;

  return (
    <div className="space-y-6 px-5 pt-8">
      {/* Brand */}
      <div className="flex justify-center">
        <img
          src={gkLogo}
          alt="GK Performance Hub"
          className="h-28 w-28 rounded-2xl object-cover shadow-glow"
        />
      </div>

      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d LLL")}</p>
          <h1 className="font-display text-3xl">
            Hey, {profile.display_name?.split(" ")[0] || "Keeper"} 🧤
          </h1>
        </div>
        <StreakBadge streak={profile.current_streak} />
      </header>

      {/* XP / Level summary */}
      <Card className="gradient-card border-border/60 shadow-card">
        <CardContent className="flex items-center gap-4 p-4">
          <XpRing current={todayXp ?? 0} goal={profile.daily_xp_goal} />
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Daily goal</p>
            <LevelBar totalXp={profile.total_xp} />
          </div>
        </CardContent>
      </Card>

      {/* Weekly challenge */}
      {challenge && (
        <Card className="border-secondary/40 bg-gradient-to-br from-secondary/15 to-transparent">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-secondary">Weekly challenge</p>
              <p className="font-display text-base font-bold">{challenge.title}</p>
              <p className="text-xs text-muted-foreground">{challenge.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">
            <Sparkles className="mr-1.5 inline h-4 w-4 text-primary" />
            Today's picks
          </h2>
          <Link to="/trainings" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {(recommended ?? []).map((t) => (
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
        </div>
      </section>

      <Link to="/trainings">
        <Button size="lg" className="w-full shadow-glow">
          Browse all trainings
        </Button>
      </Link>
    </div>
  );
};

export default Home;
