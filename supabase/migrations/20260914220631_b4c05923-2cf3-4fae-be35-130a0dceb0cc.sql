ALTER TABLE public.shipping_config
  ADD COLUMN uber_direct_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN uber_direct_zip_start text NOT NULL DEFAULT '53000000',
  ADD COLUMN uber_direct_zip_end text NOT NULL DEFAULT '55999999';

ALTER TABLE public.shipping_config
  ADD CONSTRAINT shipping_config_uber_zip_valid CHECK (
    uber_direct_zip_start ~ '^[0-9]{8}$'
    AND uber_direct_zip_end ~ '^[0-9]{8}$'
    AND uber_direct_zip_start <= uber_direct_zip_end
  );