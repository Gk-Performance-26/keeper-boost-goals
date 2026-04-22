import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user } = useAuth();

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
  const isActive =
    !!sub &&
    ["active", "trialing"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  return {
    subscription: sub,
    isActive,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
