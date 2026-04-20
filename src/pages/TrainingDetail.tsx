import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Clock, Loader2, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";

interface Drill {
  title: string;
  reps: string;
}

const TrainingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [done, setDone] = useState<Set<number>>(new Set());

  const { data: training, isLoading } = useQuery({
    queryKey: ["training", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainings")
        .select("*, categories(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!training) return <p className="p-8 text-center">Not found</p>;

  const drills = (training.drills as unknown as Drill[]) || [];
  const allDone = drills.length > 0 && done.size === drills.length;

  const toggle = (i: number) => {
    setDone((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  return (
    <div className="space-y-5 px-5 pt-6 pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <VideoPlayer url={training.video_url} type={training.video_type} />

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {training.categories && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `hsl(var(--${training.categories.color_token}) / 0.18)`,
                color: `hsl(var(--${training.categories.color_token}))`,
              }}
            >
              <CategoryIcon name={training.categories.icon} className="h-3 w-3" />
              {training.categories.name}
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{training.level}</span>
        </div>
        <h1 className="font-display text-2xl">{training.title}</h1>
        <p className="text-sm text-muted-foreground">{training.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" /> {training.duration_minutes} min
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="h-4 w-4" /> {training.xp_reward} XP
          </span>
        </div>
      </header>

      {training.equipment && training.equipment.length > 0 && (
        <Card className="gradient-card border-border/60">
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</p>
            <div className="flex flex-wrap gap-1.5">
              {training.equipment.map((e) => (
                <span key={e} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {e}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-2">
        <h2 className="font-display text-lg">Drills</h2>
        <div className="space-y-2">
          {drills.map((d, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                done.has(i)
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-muted/30 hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition",
                  done.has(i) ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {done.has(i) && <Check className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className={cn("font-semibold", done.has(i) && "line-through opacity-70")}>{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.reps}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Link to={`/trainings/${training.id}/complete`}>
        <Button size="lg" disabled={!allDone} className="w-full shadow-glow">
          {allDone ? "Finish session" : `Tick all drills (${done.size}/${drills.length})`}
        </Button>
      </Link>
    </div>
  );
};

export default TrainingDetail;
