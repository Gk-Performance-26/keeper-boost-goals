import { Link } from "react-router-dom";
import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslatedTexts } from "@/hooks/useTranslatedTexts";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  id: string;
  title: string;
  level?: string;
  duration: number;
  xp?: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColorToken?: string;
  isPremium?: boolean;
  locked?: boolean;
}

export function TrainingCard({
  id,
  title,
  duration,
  isPremium,
  locked,
}: Props) {
  const { t } = useLanguage();
  const [tTitle] = useTranslatedTexts([title]);
  const to = locked ? "/subscription" : `/trainings/${id}`;

  return (
    <Link
      to={to}
      className={cn(
        "group relative block overflow-hidden rounded-xl border px-4 py-3 transition",
        locked
          ? "border-primary/30 gradient-card hover:border-primary/60"
          : "border-border/60 gradient-card hover:border-primary/40",
      )}
    >
      {isPremium && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {locked && <Lock className="h-2.5 w-2.5" />}
          Premium
        </span>
      )}
      <div className="flex items-center justify-between gap-3">
        <h3 className={cn("min-w-0 flex-1 truncate font-display text-sm font-semibold", locked && "opacity-80")}>
          {tTitle || title}
        </h3>
        <span className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {duration}m
        </span>
      </div>
      {locked && (
        <p className="mt-1 text-[11px] font-semibold text-primary">
          {t("training.unlockWithPremium")} →
        </p>
      )}
    </Link>
  );
}
