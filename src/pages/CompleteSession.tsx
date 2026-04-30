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

import { generateFeedback } from "@/lib/gamification";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const CompleteSession = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidateProfile = useInvalidateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

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
      const skillScores = Object.entries(scores).map(([category_id, score]) => ({
        category_id,
        score,
      }));

      const { data, error } = await supabase.rpc("complete_session", {
        _training_id: training.id,
        _rating: rating,
        _notes: notes || null,
        _skill_scores: skillScores,
      });
      if (error) throw error;

      const result = data as {
        xp_earned: number;
        current_streak: number;
      } | null;

      const tips = generateFeedback(
        Object.fromEntries(
          Object.entries(scores).map(([cid, s]) => {
            const cat = categories?.find((c) => c.id === cid);
            return [cat?.slug || cid, s];
          }),
        ),
        lang,
      );
      setFeedback(tips);
      setXpGained(result?.xp_earned ?? training.xp_reward);
      invalidateProfile();
      toast({
        title: `+${result?.xp_earned ?? training.xp_reward} ${t("complete.xpEarned")} 🔥`,
        description: `${t("complete.streakDays")}: ${result?.current_streak ?? profile.current_streak}d`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("complete.couldNotSave");
      toast({ title: t("complete.saveFailed"), description: msg, variant: "destructive" });
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
          <h1 className="font-display text-3xl">{t("complete.sessionComplete")}</h1>
          <p className="text-2xl font-bold text-gradient-primary">+{xpGained} XP</p>
        </motion.div>
        <Card className="gradient-card border-border/60">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("complete.coachFeedback")}</p>
            {feedback.map((tip, i) => (
              <p key={i} className="text-sm">
                • {tip}
              </p>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button className="flex-1" variant="outline" onClick={() => navigate("/progress")}>
            {t("complete.seeProgress")}
          </Button>
          <Button className="flex-1 shadow-glow" onClick={() => navigate("/")}>
            {t("complete.doneBtn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 pt-8 pb-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("complete.selfAssessment")}</p>
        <h1 className="font-display text-2xl">{t("complete.howWasIt")}</h1>
      </header>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">{t("complete.overallFeel")}</p>
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

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-4 p-4">
          <p className="text-sm font-semibold">
            {t("complete.rateYourself")} <span className="text-muted-foreground">{t("complete.scale")}</span>
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

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">{t("complete.notes")}</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder={t("complete.notesPlaceholder")}
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
            <Sparkles className="h-4 w-4" /> {t("complete.submitEarn")} {training.xp_reward} {t("complete.xp")}
          </>
        )}
      </Button>
    </div>
  );
};

export default CompleteSession;
