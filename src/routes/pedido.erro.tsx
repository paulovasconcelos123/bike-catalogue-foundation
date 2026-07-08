import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pedido/erro")({
  head: () => ({
    meta: [
      { title: "Pagamento não concluído — Paulo Bicicletas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
  }),
  component: PedidoErro,
});

function PedidoErro() {
  const { order_id } = Route.useSearch();
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <XCircle className="mx-auto h-16 w-16 text-destructive" />
      <h1 className="mt-6 font-display text-3xl uppercase text-foreground sm:text-4xl">
        Pagamento não concluído
      </h1>
      <p className="mt-2 text-muted-foreground">
        Seu pagamento não foi finalizado. Você pode tentar de novo pelo
        carrinho ou falar com a gente no WhatsApp.
      </p>
      {order_id && (
        <p className="mt-4 text-xs uppercase text-muted-foreground">
          Pedido #{order_id.slice(0, 8)}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    </div>
  );
}
