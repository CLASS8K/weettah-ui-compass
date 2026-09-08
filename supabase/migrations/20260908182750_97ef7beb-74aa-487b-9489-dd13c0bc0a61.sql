DROP POLICY "Supplier admins can read plans" ON public.plans;
DROP POLICY "Supplier admins can create plans" ON public.plans;
DROP POLICY "Supplier admins can update plans" ON public.plans;
DROP POLICY "Supplier admins can delete plans" ON public.plans;
DROP POLICY "Supplier admins can read integration settings" ON public.integration_settings;
DROP POLICY "Supplier admins can create integration settings" ON public.integration_settings;
DROP POLICY "Supplier admins can update integration settings" ON public.integration_settings;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;