import type { ProductRow } from "@/lib/catalog.functions";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductRow[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
        Nenhum produto encontrado com esses filtros.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
