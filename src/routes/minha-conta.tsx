import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getMyOrders } from "@/lib/checkout.functions";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Paulo Bicicletas" },
      { name: "description", content: "Acompanhe seus pedidos na Paulo Bicicletas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MinhaContaPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  cancelled: "Cancelado",
  failed: "Falhou",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
  failed: "bg-destructive/15 text-destructive",
};

type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

function MinhaContaPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchOrders = useServerFn(getMyOrders);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/minha-conta" }, replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchOrders()
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, fetchOrders]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || "";

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-8">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Minha conta
        </p>
        <h1 className="mt-1 font-display text-3xl uppercase text-foreground sm:text-4xl">
          Olá, {displayName}
        </h1>
      </header>

      <section>
        <h2 className="font-display text-xl uppercase text-foreground">
          Meus pedidos
        </h2>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando pedidos...</p>
        ) : !orders || orders.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-display text-lg uppercase text-foreground">
              Nenhum pedido ainda
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando você fizer sua primeira compra, ela aparecerá aqui.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/produtos">Ver produtos</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(order.created_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>

                <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span className="text-foreground">
                        {item.quantity}× {item.product_name}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatBRL(item.unit_price_cents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="font-display text-sm uppercase text-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatBRL(order.total_cents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
