// Server-only helpers for coupon validation. Never import from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CouponValidation =
  | {
      valid: true;
      code: string;
      discount_type: "percentage" | "fixed";
      discount_value: number;
      discount_cents: number;
      final_cents: number;
    }
  | { valid: false; error: string };

export async function validateCouponInternal(
  code: string,
  orderTotalCents: number,
): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Informe um código" };

  const { data: coupon, error } = await supabaseAdmin
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, min_order_cents, max_uses, uses_count, active, expires_at",
    )
    .eq("code", normalized)
    .maybeSingle();

  if (error) {
    console.error("[validateCoupon] db", error);
    return { valid: false, error: "Erro ao validar cupom" };
  }
  if (!coupon) return { valid: false, error: "Cupom não encontrado" };
  if (!coupon.active) return { valid: false, error: "Cupom inativo" };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { valid: false, error: "Cupom expirado" };
  }
  if (coupon.uses_count >= coupon.max_uses) {
    return { valid: false, error: "Cupom esgotado" };
  }
  if (
    coupon.min_order_cents != null &&
    orderTotalCents < coupon.min_order_cents
  ) {
    return {
      valid: false,
      error: `Valor mínimo do pedido: R$ ${(coupon.min_order_cents / 100).toFixed(2)}`,
    };
  }

  const type = coupon.discount_type as "percentage" | "fixed";
  const value = Number(coupon.discount_value);
  let discount_cents =
    type === "percentage"
      ? Math.floor((orderTotalCents * value) / 100)
      : Math.floor(value);
  if (discount_cents > orderTotalCents) discount_cents = orderTotalCents;
  if (discount_cents < 0) discount_cents = 0;
  const final_cents = orderTotalCents - discount_cents;

  return {
    valid: true,
    code: coupon.code,
    discount_type: type,
    discount_value: value,
    discount_cents,
    final_cents,
  };
}
