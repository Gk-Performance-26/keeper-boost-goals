import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";

export type GoalSession = {
  completed_at: string;
  xp_earned: number;
  duration_minutes: number;
};

type GoalMetric = { metric_type: string; period: string };

// The persisted activation timestamp, not lifetime profile totals, is the baseline.
export function computeGoalProgress(
  template: GoalMetric,
  sessions: GoalSession[],
  startedAt: string,
  now = new Date(),
): number {
  const activation = new Date(startedAt).getTime();
  if (!Number.isFinite(activation)) return 0;
  let cutoff = activation;
  if (template.period === "daily") cutoff = Math.max(cutoff, startOfDay(now).getTime());
  if (template.period === "weekly") cutoff = Math.max(cutoff, subDays(now, 7).getTime());
  if (template.period === "monthly") cutoff = Math.max(cutoff, subDays(now, 30).getTime());

  const eligible = sessions.filter((session) => {
    const completed = new Date(session.completed_at).getTime();
    return completed > activation && completed >= cutoff && completed <= now.getTime();
  });

  switch (template.metric_type) {
    case "sessions":
      return eligible.length;
    case "xp":
      return eligible.reduce((sum, session) => sum + (session.xp_earned || 0), 0);
    case "minutes":
      return eligible.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    case "streak": {
      const days = [...new Set(eligible.map((session) => startOfDay(new Date(session.completed_at)).getTime()))]
        .sort((a, b) => b - a);
      const latest = days[0];
      if (latest === undefined || differenceInCalendarDays(now, latest) > 1) return 0;
      let streak = 1;
      for (let i = 1; i < days.length; i++) {
        if (differenceInCalendarDays(days[i - 1], days[i]) !== 1) break;
        streak++;
      }
      return streak;
    }
    default:
      return 0;
  }
}