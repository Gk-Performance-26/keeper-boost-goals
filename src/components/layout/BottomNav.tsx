import { NavLink } from "react-router-dom";
import { Home, Dumbbell, BarChart3, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export function BottomNav() {
  const { t } = useLanguage();
  const items = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/trainings", label: t("nav.trainings"), icon: Dumbbell },
    { to: "/progress", label: t("nav.progress"), icon: BarChart3 },
    { to: "/leaderboard", label: t("nav.leaderboard"), icon: Trophy },
    { to: "/profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border/50 bg-card/80 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
