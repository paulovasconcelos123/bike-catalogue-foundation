import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import { getOrderSummary } from "@/lib/checkout.functions";

export const Route = createFileRoute("/pedido/sucesso")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Paulo Bicicletas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  component: PedidoSucesso,
});

function PedidoSucesso() {
  const { order_id } = Route.useSearch();
  const { clearCart } = useCart();
  const fetchSummary = useServerFn(getOrderSummary);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof getOrderSummary>
  > | null>(null);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!order_id) return;
    fetchSummary({ data: { order_id } })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [order_id, fetchSummary]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
      <h1 className="mt-6 font-display text-3xl uppercase text-foreground sm:text-4xl">
        Recebemos seu pedido!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Assim que o Mercado Pago confirmar o pagamento, entramos em contato pelo
        WhatsApp para combinar a entrega ou retirada.
      </p>

      {summary && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6 text-left">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg uppercase text-foreground">
              Resumo
            </h2>
            <span className="text-xs uppercase text-muted-foreground">
              #{summary.id.slice(0, 8)}
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {summary.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span>
                  {i.quantity}× {i.product_name}
                </span>
                <span>{formatBRL(i.unit_price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display uppercase">Total</span>
            <span className="text-xl font-bold">
              {formatBRL(summary.total_cents)}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Status atual:{" "}
            <span className="font-semibold uppercase">{summary.status}</span>
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/produtos">Continuar comprando</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
