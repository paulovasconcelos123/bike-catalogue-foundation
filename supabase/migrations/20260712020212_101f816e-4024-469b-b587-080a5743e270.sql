
-- coupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_cents integer,
  max_uses integer NOT NULL CHECK (max_uses > 0),
  uses_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- no public policies: all access via service_role server-side

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce uppercase codes at DB level
CREATE OR REPLACE FUNCTION public.coupons_uppercase_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.code = upper(trim(NEW.code));
  RETURN NEW;
END;
$$;
CREATE TRIGGER coupons_uppercase_code_trg
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.coupons_uppercase_code();

-- coupon_redemptions
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_applied_cents integer NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
-- no public policies

-- orders columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;

-- Atomic redemption function: increments uses_count only if still available
CREATE OR REPLACE FUNCTION public.redeem_coupon(
  _code text,
  _order_id uuid,
  _user_id uuid,
  _discount_applied_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_updated integer;
BEGIN
  SELECT * INTO v_coupon FROM public.coupons WHERE code = upper(_code);
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Atomic increment guarded by max_uses
  UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE id = v_coupon.id
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND uses_count < max_uses;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, order_id, user_id, discount_applied_cents)
  VALUES (v_coupon.id, _order_id, _user_id, _discount_applied_cents)
  ON CONFLICT (order_id) DO NOTHING;

  RETURN true;
END;
$$;
