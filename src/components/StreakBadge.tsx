import { Flame } from "lucide-react";

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1.5 text-secondary">
      <Flame className={`h-4 w-4 ${streak > 0 ? "animate-flame" : "opacity-50"}`} />
      <span className="font-display text-sm font-bold">{streak}</span>
    </div>
  );
}
