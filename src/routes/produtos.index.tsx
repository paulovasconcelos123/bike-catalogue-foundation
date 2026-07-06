import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/produtos/")({
  loaderDeps: ({ search }) => ({
    categoria: search.categoria,
    subcategoria: search.subcategoria,
    sort: search.sort,
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(productsKey(deps));
  },
  component: ProductsIndex,
});

function productsKey(deps: {
  categoria?: string;
  subcategoria?: string;
  sort: "relevancia" | "preco-asc" | "preco-desc";
}) {
  return queryOptions({
    queryKey: ["products", deps],
    queryFn: () => listProducts({ data: deps }),
  });
}

function ProductsIndex() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const products = useSuspenseQuery(
    productsKey({
      categoria: search.categoria,
      subcategoria: search.subcategoria,
      sort: search.sort,
    }),
  ).data;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {products.length} produto{products.length === 1 ? "" : "s"}
        </p>
        <Select
          value={search.sort}
          onValueChange={(v) =>
            navigate({
              search: (prev: typeof search) => ({ ...prev, sort: v as typeof search.sort }),
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevancia">Relevância</SelectItem>
            <SelectItem value="preco-asc">Menor preço</SelectItem>
            <SelectItem value="preco-desc">Maior preço</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
