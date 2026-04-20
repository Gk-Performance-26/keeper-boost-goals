import {
  Zap,
  Crosshair,
  Footprints,
  ArrowDownRight,
  Send,
  ArrowUp,
  Swords,
  Target,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Zap,
  Crosshair,
  Footprints,
  ArrowDownRight,
  Send,
  ArrowUp,
  Swords,
  Target,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Target;
  return <Icon className={className} />;
}
