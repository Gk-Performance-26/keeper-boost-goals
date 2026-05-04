import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Compute the "live" current streak. The DB only updates current_streak when
// a session is completed, so a user who skips a day still shows their old
// streak until the next completion. Reset to 0 here when the streak has
// effectively been broken (more than 1 day gap, or > 2 days without freeze).
function effectiveStreak(profile: any): number {
  if (!profile) return 0;
  const stored = profile.current_streak ?? 0;
  if (stored === 0) return 0;
  const last = profile.last_training_date;
  if (!last) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(last + "T00:00:00");
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
  if (diffDays <= 1) return stored; // today or yesterday — still alive
  if (diffDays === 2 && (profile.freeze_tokens ?? 0) > 0) return stored; // covered by freeze
  return 0; // streak broken
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return { ...data, current_streak: effectiveStreak(data) };
      }
      return data;
    },
  });
}

export function useInvalidateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return () => qc.invalidateQueries({ queryKey: ["profile", user?.id] });
}
