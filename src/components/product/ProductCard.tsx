import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/catalog.functions";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: ProductRow }) {
  const outOfStock = product.stock <= 0;
  return (
    <Link
      to="/produtos/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
        {outOfStock && (
          <Badge variant="destructive" className="absolute right-2 top-2">
            Esgotado
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wide text-secondary/80">
          {product.category.name}
          {product.subcategory ? ` · ${product.subcategory.name}` : ""}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-lg uppercase text-foreground">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <p className="text-xl font-bold text-foreground">{formatBRL(product.price_cents)}</p>
          <span className="mt-2 inline-block text-sm font-semibold text-primary">
            Ver produto →
          </span>
        </div>
      </div>
    </Link>
  );
}
