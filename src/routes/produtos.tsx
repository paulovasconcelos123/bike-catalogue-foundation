import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { getCategoriesWithSubs } from "@/lib/catalog.functions";
import { CategoryFilter } from "@/components/product/CategoryFilter";

const catsKey = queryOptions({
  queryKey: ["categories"],
  queryFn: () => getCategoriesWithSubs(),
});

const searchSchema = z.object({
  categoria: fallback(z.string().optional(), undefined),
  subcategoria: fallback(z.string().optional(), undefined),
  sort: fallback(z.enum(["relevancia", "preco-asc", "preco-desc"]), "relevancia").default(
    "relevancia",
  ),
});

export const Route = createFileRoute("/produtos")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Produtos — Paulo Bicicletas" },
      {
        name: "description",
        content:
          "Bicicletas, peças, acessórios, vestuário e serviços. Navegue por categoria e encontre a bike ou peça certa.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(catsKey);
  },
  component: ProductsLayout,
});

function ProductsLayout() {
  const categories = useSuspenseQuery(catsKey).data;
  const { categoria, subcategoria } = Route.useSearch();

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Início</Link>
        {" / "}
        <Link to="/produtos" className="hover:text-primary">Produtos</Link>
      </nav>
      <h1 className="mb-6 font-display text-3xl uppercase text-foreground sm:text-4xl">
        Catálogo
      </h1>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <CategoryFilter
          categories={categories}
          selectedCategory={categoria}
          selectedSubcategory={subcategoria}
        />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
