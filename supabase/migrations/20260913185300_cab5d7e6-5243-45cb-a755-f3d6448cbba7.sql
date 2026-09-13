ALTER TABLE public.products
  ADD COLUMN weight_kg numeric(8,3) NOT NULL DEFAULT 0.500,
  ADD COLUMN height_cm integer NOT NULL DEFAULT 10,
  ADD COLUMN width_cm integer NOT NULL DEFAULT 15,
  ADD COLUMN length_cm integer NOT NULL DEFAULT 20;

ALTER TABLE public.products
  ADD CONSTRAINT products_weight_positive CHECK (weight_kg > 0),
  ADD CONSTRAINT products_dimensions_positive CHECK (height_cm > 0 AND width_cm > 0 AND length_cm > 0);

ALTER TABLE public.orders
  ADD COLUMN subtotal_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN shipping_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN shipping_method text NOT NULL DEFAULT 'pickup',
  ADD COLUMN shipping_service_id text,
  ADD COLUMN shipping_service_name text,
  ADD COLUMN shipping_carrier text,
  ADD COLUMN shipping_deadline_days integer;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_shipping_method_valid CHECK (shipping_method IN ('pickup', 'delivery')),
  ADD CONSTRAINT orders_shipping_cents_nonnegative CHECK (shipping_cents >= 0),
  ADD CONSTRAINT orders_subtotal_cents_nonnegative CHECK (subtotal_cents >= 0),
  ADD CONSTRAINT orders_shipping_deadline_nonnegative CHECK (shipping_deadline_days IS NULL OR shipping_deadline_days >= 0);

CREATE TABLE public.shipping_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  superfrete_enabled boolean NOT NULL DEFAULT true,
  origin_zip text NOT NULL DEFAULT '54589050',
  enabled_services text NOT NULL DEFAULT '1,2,17,3,31',
  default_weight_kg numeric(8,3) NOT NULL DEFAULT 0.500,
  default_height_cm integer NOT NULL DEFAULT 10,
  default_width_cm integer NOT NULL DEFAULT 15,
  default_length_cm integer NOT NULL DEFAULT 20,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_config_origin_zip_valid CHECK (origin_zip ~ '^[0-9]{8}$'),
  CONSTRAINT shipping_config_defaults_positive CHECK (
    default_weight_kg > 0 AND default_height_cm > 0 AND default_width_cm > 0 AND default_length_cm > 0
  )
);
GRANT ALL ON public.shipping_config TO service_role;
ALTER TABLE public.shipping_config ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_shipping_config_updated_at
  BEFORE UPDATE ON public.shipping_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zip_start text NOT NULL,
  zip_end text NOT NULL,
  weight_min_kg numeric(8,3) NOT NULL DEFAULT 0,
  weight_max_kg numeric(8,3) NOT NULL,
  price_cents integer NOT NULL,
  deadline_days integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  provisional boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipping_rates_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT shipping_rates_zip_valid CHECK (zip_start ~ '^[0-9]{8}$' AND zip_end ~ '^[0-9]{8}$' AND zip_start <= zip_end),
  CONSTRAINT shipping_rates_weight_valid CHECK (weight_min_kg >= 0 AND weight_max_kg > weight_min_kg),
  CONSTRAINT shipping_rates_price_valid CHECK (price_cents >= 0),
  CONSTRAINT shipping_rates_deadline_valid CHECK (deadline_days > 0)
);
GRANT ALL ON public.shipping_rates TO service_role;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

UPDATE public.orders
SET subtotal_cents = total_cents
WHERE subtotal_cents = 0;