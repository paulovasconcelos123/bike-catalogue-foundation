
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Public read
CREATE POLICY "Public can read product-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

-- Admin write
CREATE POLICY "Admins can upload product-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));
