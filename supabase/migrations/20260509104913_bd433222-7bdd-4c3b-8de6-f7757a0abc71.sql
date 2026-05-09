CREATE OR REPLACE FUNCTION public.get_admin_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM public.user_roles WHERE role = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_count() TO authenticated, anon;