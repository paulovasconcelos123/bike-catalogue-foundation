import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { formatBRL, whatsappLinkWithText } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, ShoppingBag } from "lucide-react";

function productKey(slug: string) {
  return queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const p = await getProductBySlug({ data: { slug } });
      if (!p) throw notFound();
      return p;
    },
  });
}

export const Route = createFileRoute("/produtos/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productKey(params.slug));
    return { title: data.name };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — Paulo Bicicletas` },
          { name: "description", content: `${loaderData.title} na Paulo Bicicletas.` },
        ]
      : [{ title: "Produto — Paulo Bicicletas" }],
  }),
  component: ProductDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl uppercase">Produto não encontrado</h1>
      <Link to="/produtos" className="mt-4 inline-block text-primary hover:underline">
        Voltar ao catálogo
      </Link>
    </div>
  ),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const product = useSuspenseQuery(productKey(slug)).data;
  const [active, setActive] = useState(0);
  const outOfStock = product.stock <= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Início</Link>
        {" / "}
        <Link to="/produtos" className="hover:text-primary">Produtos</Link>
        {" / "}
        <Link to="/produtos" search={{ categoria: product.category.slug }} className="hover:text-primary">
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <img
              src={product.images[active] ?? product.images[0]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border-2 ${
                    i === active ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-secondary">
            {product.category.name}
            {product.subcategory ? ` · ${product.subcategory.name}` : ""}
          </p>
          <h1 className="mt-1 font-display text-3xl uppercase text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-bold text-foreground">
            {formatBRL(product.price_cents)}
          </p>
          <div className="mt-3">
            {outOfStock ? (
              <Badge variant="destructive">Esgotado</Badge>
            ) : (
              <Badge className="bg-secondary text-secondary-foreground">
                {product.stock} em estoque
              </Badge>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-foreground/85">{product.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={outOfStock}
              onClick={() => {
                addItem({
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_cents: product.price_cents,
                  image: product.images[0] ?? null,
                  stock: product.stock,
                });
                toast.success("Adicionado ao carrinho", {
                  description: product.name,
                  action: {
                    label: "Ver carrinho",
                    onClick: () => navigate({ to: "/carrinho" }),
                  },
                });
              }}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {outOfStock ? "Esgotado" : "Adicionar ao carrinho"}
            </Button>
            <a
              href={whatsappLinkWithText(`Olá! Tenho interesse na ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
