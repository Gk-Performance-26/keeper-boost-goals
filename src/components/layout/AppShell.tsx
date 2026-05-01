import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Loader2 } from "lucide-react";

export function AppShell() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;

  if (profile && !profile.onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-40 mx-auto flex max-w-md justify-end px-4 pt-12">
        <div className="pointer-events-auto">
          <LanguageSwitcher />
        </div>
      </div>
      <main className="flex-1 pb-2">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

