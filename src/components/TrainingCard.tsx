import { Link } from "react-router-dom";
import { Clock, Sparkles } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";

interface Props {
  id: string;
  title: string;
  level: string;
  duration: number;
  xp: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryColorToken?: string;
}

export function TrainingCard({ id, title, level, duration, xp, categoryName, categoryIcon, categoryColorToken }: Props) {
  return (
    <Link
      to={`/trainings/${id}`}
      className="group relative block overflow-hidden rounded-2xl border border-border/60 gradient-card p-4 shadow-card transition hover:border-primary/40 hover:shadow-glow"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `hsl(var(--${categoryColorToken || "primary"}) / 0.18)`,
            color: `hsl(var(--${categoryColorToken || "primary"}))`,
          }}
        >
          <CategoryIcon name={categoryIcon || "Target"} className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{categoryName}</p>
          <h3 className="truncate font-display text-base font-bold">{title}</h3>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration} min
            </span>
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" />
              {xp} XP
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">{level}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
