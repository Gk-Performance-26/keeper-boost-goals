import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useAdminCount() {
  return useQuery({
    queryKey: ["admin-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_count");
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}
