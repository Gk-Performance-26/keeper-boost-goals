import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type GoalTemplate = {
  id: string;
  title: string;
  description: string | null;
  metric_type: string;
  target_value: number;
  period: string;
  icon: string;
  color_token: string;
  xp_reward: number;
  is_active: boolean;
  sort_order: number;
};

export type UserGoal = {
  id: string;
  user_id: string;
  template_id: string;
  current_value: number;
  started_at: string;
  completed_at: string | null;
  template?: GoalTemplate;
};

export function useGoalTemplates() {
  return useQuery({
    queryKey: ["goal-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_templates")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoalTemplate[];
    },
  });
}

export function useUserGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*, template:goal_templates(*)")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserGoal[];
    },
  });
}
