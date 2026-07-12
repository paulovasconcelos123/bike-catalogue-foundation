import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  unit_price_cents: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(8).max(30),
  address: z.object({
    street: z.string().trim().min(1).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(120).optional().or(z.literal("")),
    neighborhood: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().length(2),
    zip: z.string().trim().min(8).max(9),
  }),
  items: z.array(itemSchema).min(1).max(50),
  coupon_code: z.string().trim().max(60).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const createPaymentPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const totalCents = data.items.reduce(
      (sum, i) => sum + i.unit_price_cents * i.quantity,
      0,
    );

    // Server-side coupon validation (never trust client discount)
    let discountCents = 0;
    let couponCode: string | null = null;
    if (data.coupon_code && data.coupon_code.trim()) {
      const { validateCouponInternal } = await import("./coupons.server");
      const result = await validateCouponInternal(data.coupon_code, totalCents);
      if (!result.valid) {
        throw new Error(`Cupom inválido: ${result.error}`);
      }
      discountCents = result.discount_cents;
      couponCode = result.code;
    }
    const finalCents = totalCents - discountCents;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        address_street: data.address.street,
        address_number: data.address.number,
        address_complement: data.address.complement || null,
        address_neighborhood: data.address.neighborhood,
        address_city: data.address.city,
        address_state: data.address.state.toUpperCase(),
        address_zip: data.address.zip.replace(/\D/g, ""),
        total_cents: finalCents,
        discount_cents: discountCents,
        coupon_code: couponCode,
        status: "pending",
        user_id: context.userId,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[checkout] falha ao criar order", orderError);
      throw new Error("Não foi possível criar o pedido");
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        data.items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.product_name,
          unit_price_cents: i.unit_price_cents,
          quantity: i.quantity,
        })),
      );

    if (itemsError) {
      console.error("[checkout] falha ao criar order_items", itemsError);
      throw new Error("Não foi possível salvar os itens do pedido");
    }

    // URL base para retornos e webhook
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const origin = new URL(req.url).origin;

    const preferencePayload = {
      items: data.items.map((i) => ({
        id: i.product_id,
        title: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price_cents / 100,
        currency_id: "BRL",
      })),
      payer: {
        name: data.customer_name,
        email: data.customer_email,
      },
      external_reference: order.id,
      back_urls: {
        success: `${origin}/pedido/sucesso?order_id=${order.id}`,
        failure: `${origin}/pedido/erro?order_id=${order.id}`,
        pending: `${origin}/pedido/sucesso?order_id=${order.id}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mercado-pago-webhook`,
      metadata: { order_id: order.id },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpRes.ok) {
      const body = await mpRes.text();
      console.error("[checkout] MP preference falhou", mpRes.status, body);
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      throw new Error("Falha ao criar preferência no Mercado Pago");
    }

    const mp = (await mpRes.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point?: string;
    };

    await supabaseAdmin
      .from("orders")
      .update({ mp_preference_id: mp.id })
      .eq("id", order.id);

    const isSandbox = accessToken.startsWith("TEST-");
    const checkoutUrl =
      isSandbox && mp.sandbox_init_point ? mp.sandbox_init_point : mp.init_point;

    return { order_id: order.id, checkout_url: checkoutUrl };
  });

const orderSummarySchema = z.object({ order_id: z.string().uuid() });

export const getOrderSummary = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => orderSummarySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_cents, customer_name, created_at")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) {
      console.error("[getOrderSummary] erro", error);
      return null;
    }
    if (!order) return null;
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_name, unit_price_cents, quantity")
      .eq("order_id", data.order_id);
    return { ...order, items: items ?? [] };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getMyOrders] erro", error);
      return [];
    }
    if (!orders || orders.length === 0) return [];
    const ids = orders.map((o) => o.id);
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("order_id, product_name, unit_price_cents, quantity")
      .in("order_id", ids);
    return orders.map((o) => ({
      ...o,
      items: (items ?? []).filter((i) => i.order_id === o.id),
    }));
  });
