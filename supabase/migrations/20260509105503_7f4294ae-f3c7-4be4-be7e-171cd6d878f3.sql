REVOKE EXECUTE ON FUNCTION public.get_admin_count() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_admin_count() TO authenticated;