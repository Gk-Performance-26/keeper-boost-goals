import { Link } from "react-router-dom";
import { Clock, Lock, Sparkles } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  id: string;
  title: string;
  level: string;
  duration: number;
  xp: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColorToken?: string;
  isPremium?: boolean;
  locked?: boolean;
}

export function TrainingCard({
  id,
  title,
  level,
  duration,
  xp,
  categoryName,
  categoryIcon,
  categoryColorToken,
  isPremium,
  locked,
}: Props) {
  const { t } = useLanguage();
  const [tTitle, tCategory] = useTranslatedTexts([title, categoryName]);
  const to = locked ? "/subscription" : `/trainings/${id}`;

  return (
    <Link
      to={to}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border p-4 shadow-card transition",
        locked
          ? "border-primary/30 gradient-card hover:border-primary/60"
          : "border-border/60 gradient-card hover:border-primary/40 hover:shadow-glow",
      )}
    >
      {isPremium && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {locked && <Lock className="h-2.5 w-2.5" />}
          Premium
        </span>
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl",
            locked && "opacity-60",
          )}
          style={{
            backgroundColor: `hsl(var(--${categoryColorToken || "primary"}) / 0.18)`,
            color: `hsl(var(--${categoryColorToken || "primary"}))`,
          }}
        >
          {locked ? (
            <Lock className="h-5 w-5" />
          ) : (
            <CategoryIcon name={categoryIcon || "Target"} className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{tCategory || categoryName}</p>
          <h3 className={cn("truncate font-display text-base font-bold", locked && "opacity-80")}>{tTitle || title}</h3>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration} min
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">{level}</span>
          </div>
          {locked && (
            <p className="mt-2 text-[11px] font-semibold text-primary">
              {t("training.unlockWithPremium")} →
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
