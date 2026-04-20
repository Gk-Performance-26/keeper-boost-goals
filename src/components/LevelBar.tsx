import { levelFromXp } from "@/lib/gamification";

export function LevelBar({ totalXp }: { totalXp: number }) {
  const { level, xpInLevel, xpForNext } = levelFromXp(totalXp);
  const pct = Math.min(100, (xpInLevel / xpForNext) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-display font-bold text-primary">Lv {level}</span>
        <span className="text-muted-foreground">
          {xpInLevel} / {xpForNext} XP
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full gradient-xp transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
