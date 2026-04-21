import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBar } from "@/components/LevelBar";
import { Flame, LogOut, Settings, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();

  if (!profile) return null;

  return (
    <div className="space-y-5 px-5 pt-8 pb-6">
      <header className="flex flex-col items-center gap-3 pt-4 text-center">
        <Avatar className="h-24 w-24 ring-4 ring-primary/30 shadow-glow">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="text-3xl">
            {(profile.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-2xl">{profile.display_name ?? "Keeper"}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {profile.experience_level} · {profile.age_group ?? "—"}
          </p>
        </div>
      </header>

      <Card className="gradient-card border-border/60">
        <CardContent className="space-y-3 p-4">
          <LevelBar totalXp={profile.total_xp} />
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <Stat icon={<Sparkles className="h-3 w-3" />} value={profile.total_xp} label="XP" />
            <Stat icon={<Flame className="h-3 w-3" />} value={profile.current_streak} label="Streak" />
            <Stat icon={<Trophy className="h-3 w-3" />} value={profile.longest_streak} label="Best" />
          </div>
        </CardContent>
      </Card>

      {profile.training_goal && (
        <Card className="gradient-card border-border/60">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My goal</p>
            <p className="mt-1 text-sm">{profile.training_goal}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Link to="/onboarding">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="h-4 w-4" /> Edit profile
          </Button>
        </Link>
        {isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="w-full justify-start">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Button>
          </Link>
        )}
        <Button variant="outline" className="w-full justify-start text-destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">{user?.email}</p>
    </div>
  );
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon} <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  );
}

export default Profile;
