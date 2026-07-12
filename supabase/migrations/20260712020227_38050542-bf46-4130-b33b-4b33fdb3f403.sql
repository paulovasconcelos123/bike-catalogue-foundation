
REVOKE ALL ON FUNCTION public.redeem_coupon(text, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, uuid, uuid, integer) TO service_role;
