GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_rates TO authenticated;

CREATE POLICY "Admins can read shipping config"
ON public.shipping_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shipping config"
ON public.shipping_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read shipping rates"
ON public.shipping_rates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create shipping rates"
ON public.shipping_rates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shipping rates"
ON public.shipping_rates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shipping rates"
ON public.shipping_rates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));