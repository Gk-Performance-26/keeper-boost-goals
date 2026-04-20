import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInvalidateProfile, useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AGE_GROUPS, DOMINANT_HANDS, EXPERIENCE_LEVELS, ExperienceLevel } from "@/lib/gamification";
import { ChevronRight, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const Onboarding = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidate = useInvalidateProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<ExperienceLevel>(profile?.experience_level || "beginner");
  const [age, setAge] = useState<string>(profile?.age_group || "Senior");
  const [hand, setHand] = useState<"left" | "right" | "both">(
    (profile?.dominant_hand as "left" | "right" | "both") || "right",
  );
  const [goal, setGoal] = useState(profile?.training_goal || "");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        experience_level: level,
        age_group: age,
        dominant_hand: hand,
        training_goal: goal || null,
        onboarded: true,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
    toast({ title: "All set! 🧤", description: "Let's get you training." });
    navigate("/");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Step {step + 1} of 4</p>
          <h2 className="font-display text-xl">Set up your kit</h2>
        </div>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full gradient-primary transition-all"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      <Card className="gradient-card border-border/60 shadow-card">
        <CardContent className="space-y-5 p-6">
          {step === 0 && (
            <>
              <h3 className="font-display text-2xl">What's your level?</h3>
              <div className="grid gap-2">
                {EXPERIENCE_LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 text-left transition",
                      level === l.value
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    <span className="font-semibold">{l.label}</span>
                    {level === l.value && <ChevronRight className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="font-display text-2xl">Age group</h3>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={cn(
                      "rounded-xl border p-3 font-semibold transition",
                      age === a
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-display text-2xl">Dominant hand</h3>
              <div className="grid grid-cols-3 gap-2">
                {DOMINANT_HANDS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setHand(h.value)}
                    className={cn(
                      "rounded-xl border p-4 font-semibold transition",
                      hand === h.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="font-display text-2xl">Your training goal</h3>
              <p className="text-sm text-muted-foreground">Optional. Helps us recommend sessions.</p>
              <div className="space-y-1.5">
                <Label htmlFor="goal">Goal</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Be more confident on crosses..."
                  maxLength={120}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button className="flex-1 shadow-glow" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="flex-1 shadow-glow" onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start training"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
