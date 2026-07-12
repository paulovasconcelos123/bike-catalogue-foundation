import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/**
 * Pure validation (no side effects, no increment). Used by:
 * - checkout preview (UI)
 * - createPaymentPreference (server, before saving order)
 */
export async function validateCouponInternal(
  code: string,
  orderTotalCents: number,
): Promise<CouponValidation> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Informe um código" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

// ---------- Public (auth-only) validation for checkout preview ----------
export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        code: z.string().trim().min(1).max(60),
        order_total_cents: z.number().int().nonnegative(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return validateCouponInternal(data.code, data.order_total_cents);
  });

// ---------- Admin CRUD ----------
export const adminListCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const couponInput = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, _ ou -"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().positive(),
  min_order_cents: z.number().int().nonnegative().nullable().optional(),
  max_uses: z.number().int().positive(),
  active: z.boolean().default(true),
  expires_at: z.string().nullable().optional(),
});

export const adminUpsertCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => couponInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.discount_type === "percentage" && data.discount_value > 100) {
      throw new Error("Percentual não pode ser maior que 100");
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const row = {
      code: data.code.toUpperCase(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      min_order_cents: data.min_order_cents ?? null,
      max_uses: data.max_uses,
      active: data.active,
      expires_at: data.expires_at || null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("coupons")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin
      .from("coupons")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminToggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
