// XP & level math + helpers shared across the app.
// Level n requires totalXp >= 100 * n * (n-1) / 2 * 5  -> simple curve.
// We keep it transparent: each level needs `100 * level` more XP than the previous.
export function levelFromXp(totalXp: number): { level: number; xpInLevel: number; xpForNext: number } {
  let level = 1;
  let remaining = totalXp;
  while (true) {
    const needed = 100 * level;
    if (remaining < needed) {
      return { level, xpInLevel: remaining, xpForNext: needed };
    }
    remaining -= needed;
    level += 1;
  }
}

export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "pro", label: "Pro" },
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["value"];

export const AGE_GROUPS = ["U12", "U14", "U16", "U18", "Senior"] as const;

export const DOMINANT_HANDS = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "both", label: "Both" },
] as const;

export const PLAYING_STYLES = [
  { value: "libero", label: "GR líbero" },
  { value: "aerial", label: "Forte no jogo aéreo" },
  { value: "quick_exits", label: "GR rápido nas saídas" },
  { value: "imposing", label: "Imponente" },
  { value: "quick_reflexes", label: "Reflexos rápidos" },
  { value: "strong_hands", label: "Mãos fortes" },
] as const;

export type PlayingStyle = (typeof PLAYING_STYLES)[number]["value"];

export function generateFeedback(scores: Record<string, number>): string[] {
  const tips: string[] = [];
  Object.entries(scores).forEach(([slug, score]) => {
    if (score <= 4) {
      tips.push(`Your ${slug.replace("_", " ")} score is low — try a beginner ${slug} drill next.`);
    } else if (score >= 8) {
      tips.push(`Strong ${slug.replace("_", " ")} performance! Try the advanced level next.`);
    }
  });
  if (tips.length === 0) tips.push("Solid balanced session — keep stacking those reps!");
  return tips;
}
