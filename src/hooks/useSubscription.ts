import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const TRIAL_DAYS = 5;

export function useSubscription() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sub = query.data;
  const hasPaidSub =
    !!sub &&
    ["active", "trialing"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  // Free trial: 5 days from profile creation, no payment required
  let trialEndsAt: Date | null = null;
  let isTrialActive = false;
  let trialDaysLeft = 0;

  if (profile?.created_at) {
    trialEndsAt = new Date(
      new Date(profile.created_at).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );
    const msLeft = trialEndsAt.getTime() - Date.now();
    isTrialActive = msLeft > 0;
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  }

  const isActive = hasPaidSub || isTrialActive;

  return {
    subscription: sub,
    isActive,
    hasPaidSub,
    isTrialActive,
    trialEndsAt,
    trialDaysLeft,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
