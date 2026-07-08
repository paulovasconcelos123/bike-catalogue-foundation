import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mercado-pago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Reply fast — MP retries if we don't 200 promptly.
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) {
          console.error("[mp-webhook] token não configurado");
          return new Response("ok");
        }

        let paymentId: string | null = null;
        try {
          const url = new URL(request.url);
          paymentId =
            url.searchParams.get("data.id") ??
            url.searchParams.get("id") ??
            null;
          const type =
            url.searchParams.get("type") ?? url.searchParams.get("topic");

          if (request.method === "POST") {
            const raw = await request.text();
            if (raw) {
              try {
                const body = JSON.parse(raw) as {
                  data?: { id?: string | number };
                  type?: string;
                  action?: string;
                };
                if (!paymentId && body?.data?.id) {
                  paymentId = String(body.data.id);
                }
                const bodyType = body?.type ?? body?.action;
                if (bodyType && !type && !bodyType.includes("payment")) {
                  return new Response("ok");
                }
              } catch {
                /* not JSON, ignore */
              }
            }
          }

          if (type && !type.includes("payment")) {
            return new Response("ok");
          }
          if (!paymentId) return new Response("ok");
        } catch (err) {
          console.error("[mp-webhook] parse", err);
          return new Response("ok");
        }

        // Process synchronously so the order is updated before we ack.
        try {
          const res = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (!res.ok) {
            console.error("[mp-webhook] fetch payment", res.status);
            return new Response("ok");
          }
          const payment = (await res.json()) as {
            id: number | string;
            status: string;
            external_reference?: string;
            metadata?: { order_id?: string };
          };
          const orderId =
            payment.external_reference || payment.metadata?.order_id;
          if (!orderId) {
            console.warn("[mp-webhook] payment sem external_reference", payment.id);
            return new Response("ok");
          }
          const mapping: Record<string, "paid" | "cancelled" | "failed" | "pending"> =
            {
              approved: "paid",
              authorized: "paid",
              in_process: "pending",
              pending: "pending",
              rejected: "failed",
              cancelled: "cancelled",
              refunded: "cancelled",
              charged_back: "cancelled",
            };
          const nextStatus = mapping[payment.status] ?? "pending";

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const { error } = await supabaseAdmin
            .from("orders")
            .update({
              status: nextStatus,
              mp_payment_id: String(payment.id),
            })
            .eq("id", orderId);
          if (error) console.error("[mp-webhook] update order", error);
        } catch (err) {
          console.error("[mp-webhook] processing", err);
        }

        return new Response("ok");

      },
      GET: async () => new Response("ok"),
    },
  },
});
