import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInvalidateProfile, useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Sparkles, Trophy } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { generateFeedback } from "@/lib/gamification";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CompleteSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidateProfile = useInvalidateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [xpGained, setXpGained] = useState(0);

  const { data: training } = useQuery({
    queryKey: ["training", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("trainings")
        .select("*, categories(*)")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const [scores, setScores] = useState<Record<string, number>>({});

  const setScore = (categoryId: string, value: number) => setScores((s) => ({ ...s, [categoryId]: value }));

  const submit = async () => {
    if (!user || !training || !profile) return;
    setSubmitting(true);
    try {
      // 1) insert session
      const { data: sessionRow, error: sessionErr } = await supabase
        .from("completed_sessions")
        .insert({
          user_id: user.id,
          training_id: training.id,
          notes: notes || null,
          rating,
          duration_minutes: training.duration_minutes,
          xp_earned: training.xp_reward,
        })
        .select()
        .single();
      if (sessionErr) throw sessionErr;

      // 2) insert skill scores
      const skillRows = Object.entries(scores).map(([category_id, score]) => ({
        user_id: user.id,
        session_id: sessionRow.id,
        category_id,
        score,
      }));
      if (skillRows.length) {
        const { error: skillErr } = await supabase.from("skill_scores").insert(skillRows);
        if (skillErr) throw skillErr;
      }

      // 3) update profile xp + streak
      const today = new Date();
      const last = profile.last_training_date ? new Date(profile.last_training_date) : null;
      let newStreak = profile.current_streak;
      if (!last) newStreak = 1;
      else {
        const diff = differenceInCalendarDays(today, last);
        if (diff === 0) newStreak = profile.current_streak; // same day
        else if (diff === 1) newStreak = profile.current_streak + 1;
        else if (diff === 2 && profile.freeze_tokens > 0) newStreak = profile.current_streak + 1;
        else newStreak = 1;
      }
      const newTotalXp = profile.total_xp + training.xp_reward;
      const longest = Math.max(profile.longest_streak, newStreak);
      const usedFreeze =
        last && differenceInCalendarDays(today, last) === 2 && profile.freeze_tokens > 0
          ? profile.freeze_tokens - 1
          : profile.freeze_tokens;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          total_xp: newTotalXp,
          current_streak: newStreak,
          longest_streak: longest,
          last_training_date: today.toISOString().slice(0, 10),
          freeze_tokens: usedFreeze,
        })
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      // 4) feedback
      const tips = generateFeedback(
        Object.fromEntries(
          Object.entries(scores).map(([cid, s]) => {
            const cat = categories?.find((c) => c.id === cid);
            return [cat?.slug || cid, s];
          }),
        ),
      );
      setFeedback(tips);
      setXpGained(training.xp_reward);
      invalidateProfile();
      toast({ title: `+${training.xp_reward} XP earned 🔥`, description: `Streak: ${newStreak} days` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save session";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!training) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const trainingCategoryId = training.category_id;

  if (feedback) {
    return (
      <div className="space-y-6 px-5 pt-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full gradient-primary shadow-glow">
            <Trophy className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl">Session complete!</h1>
          <p className="text-2xl font-bold text-gradient-primary">+{xpGained} XP</p>
        </motion.div>
        <Card className="gradient-card border-border/60">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Coach feedback</p>
            {feedback.map((t, i) => (
              <p key={i} className="text-sm">
                • {t}
              </p>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button className="flex-1" variant="outline" onClick={() => navigate("/progress")}>
            See progress
          </Button>
          <Button className="flex-1 shadow-glow" onClick={() => navigate("/")}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 pt-8 pb-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Self-assessment</p>
        <h1 className="font-display text-2xl">How did it go?</h1>
      </header>

      {/* Rating */}
      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Overall feel</p>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="p-1">
                <Star
                  className={cn(
                    "h-8 w-8 transition",
                    n <= rating ? "fill-secondary text-secondary" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill scores — featured first */}
      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-4 p-4">
          <p className="text-sm font-semibold">
            Rate yourself <span className="text-muted-foreground">(0–10)</span>
          </p>
          {(categories ?? [])
            .sort((a, b) => (a.id === trainingCategoryId ? -1 : b.id === trainingCategoryId ? 1 : 0))
            .map((c) => {
              const v = scores[c.id] ?? 5;
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span
                      className="font-display font-bold"
                      style={{ color: `hsl(var(--${c.color_token}))` }}
                    >
                      {v}
                    </span>
                  </div>
                  <Slider
                    value={[v]}
                    onValueChange={([val]) => setScore(c.id, val)}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Notes</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="What worked, what didn't..."
            rows={3}
          />
          <p className="text-right text-[10px] text-muted-foreground">{notes.length}/500</p>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full shadow-glow" onClick={submit} disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Submit & earn {training.xp_reward} XP
          </>
        )}
      </Button>
    </div>
  );
};

export default CompleteSession;
