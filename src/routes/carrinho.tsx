import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Paulo Bicicletas" },
      { name: "description", content: "Itens no seu carrinho na Paulo Bicicletas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalCents, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 font-display text-3xl uppercase text-foreground">
          Seu carrinho está vazio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore o catálogo e adicione uma bicicleta ou peça.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl uppercase text-foreground sm:text-4xl">
        Carrinho
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totalItems} {totalItems === 1 ? "item" : "itens"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <Link
                to="/produtos/$slug"
                params={{ slug: item.slug }}
                className="shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/produtos/$slug"
                    params={{ slug: item.slug }}
                    className="font-display text-base uppercase text-foreground hover:text-primary sm:text-lg"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remover ${item.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBRL(item.price_cents)} un.
                </p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-md border border-input">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Diminuir quantidade"
                      className="p-2 text-foreground disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Aumentar quantidade"
                      className="p-2 text-foreground disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-bold text-foreground">
                    {formatBRL(item.price_cents * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-xl uppercase text-foreground">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">{formatBRL(totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd className="text-muted-foreground">Calculado no checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-display text-lg uppercase text-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">{formatBRL(totalCents)}</span>
          </div>
          <Button asChild size="lg" className="mt-6 w-full">
            <Link to="/checkout">Finalizar compra</Link>
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={clearCart}
          >
            Esvaziar carrinho
          </Button>
          <Link
            to="/produtos"
            className="mt-4 block text-center text-sm text-primary hover:underline"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
