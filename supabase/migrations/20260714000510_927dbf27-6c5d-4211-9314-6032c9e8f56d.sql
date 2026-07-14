
-- 1. Add 'delivered' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivered';

-- 2. product_reviews table
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user ON public.product_reviews(user_id);

GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public"
  ON public.product_reviews FOR SELECT
  USING (true);

-- Insert only if user has a delivered order containing that product.
-- Uses status::text to avoid enum-literal-in-same-tx issue.
CREATE POLICY "Users can create reviews for delivered purchases"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = product_reviews.product_id
        AND o.id = product_reviews.order_id
        AND o.user_id = auth.uid()
        AND o.status::text = 'delivered'
    )
  );

-- 3. product_review_media table
CREATE TABLE public.product_review_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_media_review ON public.product_review_media(review_id);

GRANT SELECT ON public.product_review_media TO anon;
GRANT SELECT, INSERT ON public.product_review_media TO authenticated;
GRANT ALL ON public.product_review_media TO service_role;

ALTER TABLE public.product_review_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review media is public"
  ON public.product_review_media FOR SELECT
  USING (true);

CREATE POLICY "Users can add media to their own reviews"
  ON public.product_review_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_reviews pr
      WHERE pr.id = product_review_media.review_id
        AND pr.user_id = auth.uid()
    )
  );

-- 4. Storage policies for review-media bucket (bucket created via tool)
-- Public read is inherited from bucket public flag; we still add explicit anon SELECT for clarity.
CREATE POLICY "Review media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-media');

CREATE POLICY "Users upload review media in their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete their own review media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'review-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins manage all review media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));
