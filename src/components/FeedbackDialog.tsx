import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Star, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "general" | "bug" | "feature" | "praise";

const feedbackSchema = z.object({
  category: z.enum(["general", "bug", "feature", "praise"]),
  rating: z.number().int().min(1).max(5).nullable(),
  message: z.string().trim().min(3).max(2000),
});

interface FeedbackDialogProps {
  trigger: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<Category>("general");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const reset = () => {
    setCategory("general");
    setRating(null);
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    const parsed = feedbackSchema.safeParse({ category, rating, message });
    if (!parsed.success) {
      toast.error(t("feedback.tooShort"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        category: parsed.data.category,
        rating: parsed.data.rating,
        message: parsed.data.message,
      });
      if (error) throw error;
      toast.success(t("feedback.success"));
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(t("feedback.error") + (e?.message ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("feedback.title")}
          </DialogTitle>
          <DialogDescription>{t("feedback.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fb-category">{t("feedback.category")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger id="fb-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t("feedback.cat.general")}</SelectItem>
                <SelectItem value="bug">{t("feedback.cat.bug")}</SelectItem>
                <SelectItem value="feature">{t("feedback.cat.feature")}</SelectItem>
                <SelectItem value="praise">{t("feedback.cat.praise")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("feedback.rating")}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      rating && n <= rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-message">{t("feedback.message")}</Label>
            <Textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback.placeholder")}
              rows={5}
              maxLength={2000}
            />
            <p className="text-right text-[10px] text-muted-foreground">{message.length}/2000</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            {t("feedback.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || message.trim().length < 3}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("feedback.sending")}
              </>
            ) : (
              t("feedback.submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
