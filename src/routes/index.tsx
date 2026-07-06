import { createFileRoute, Link, useServerFn } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import {
  getFeaturedProducts,
  getCategoriesWithSubs,
  listBlogPosts,
} from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product/ProductGrid";
import { WHATSAPP_LINK, STORE_ADDRESS_SHORT } from "@/lib/format";

const featuredKey = queryOptions({
  queryKey: ["featured-products"],
  queryFn: () => getFeaturedProducts(),
});
const catsKey = queryOptions({
  queryKey: ["categories"],
  queryFn: () => getCategoriesWithSubs(),
});
const postsKey = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: () => listBlogPosts(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paulo Bicicletas — Bicicletas, peças e serviços em Cabo de Santo Agostinho" },
      {
        name: "description",
        content:
          "Loja de bicicletas em Cabo de Santo Agostinho, PE, desde 1997. Bicicletas urbanas, MTB, speed, elétricas, peças, acessórios e revisão.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredKey),
      context.queryClient.ensureQueryData(catsKey),
      context.queryClient.ensureQueryData(postsKey),
    ]);
  },
  component: Home,
});

function Home() {
  const featured = useSuspenseQuery(featuredKey).data;
  const categories = useSuspenseQuery(catsKey).data;
  const posts = useSuspenseQuery(postsKey).data;

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="mb-3 font-display text-sm uppercase tracking-widest text-primary">
              Desde 1997 · Cabo de Santo Agostinho
            </p>
            <h1 className="font-display text-4xl uppercase leading-tight sm:text-5xl md:text-6xl">
              A bike certa <br className="hidden sm:block" />
              pra sua pedalada.
            </h1>
            <p className="mt-4 max-w-lg text-secondary-foreground/85">
              Urbanas, MTB, speed, infantis e elétricas. Peças, acessórios e a revisão feita por
              quem entende de bike de verdade.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display uppercase text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Ver catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 font-display uppercase text-secondary-foreground transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1400&q=80"
              alt="Bicicleta em destaque"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl uppercase sm:text-3xl">Categorias</h2>
          <Link to="/produtos" className="text-sm font-semibold text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to="/produtos"
              search={{ categoria: cat.slug }}
              className="group flex aspect-square items-end rounded-xl bg-muted p-4 transition-transform hover:-translate-y-1"
            >
              <span className="font-display text-lg uppercase leading-tight text-foreground group-hover:text-primary">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl uppercase sm:text-3xl">Em destaque</h2>
          <Link to="/produtos" className="text-sm font-semibold text-primary hover:underline">
            Ver todos →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {/* SOBRE */}
      <section className="bg-muted">
        <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-2 font-display text-sm uppercase tracking-widest text-primary">
              Nossa história
            </p>
            <h2 className="font-display text-3xl uppercase sm:text-4xl">
              Loja de bairro, referência regional.
            </h2>
            <p className="mt-4 text-foreground/85">
              A Paulo Bicicletas nasceu em 1997 e cresceu junto com a cidade. Atendemos ciclistas
              do dia a dia, competidores e a molecada que está começando agora — com o mesmo
              cuidado.
            </p>
            <Link
              to="/sobre"
              className="mt-6 inline-flex items-center gap-2 font-display uppercase text-primary hover:underline"
            >
              Conheça a loja <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="flex items-start gap-2 text-sm text-foreground/80">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {STORE_ADDRESS_SHORT}
            </p>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl uppercase sm:text-3xl">Conteúdo</h2>
          <Link to="/blog" className="text-sm font-semibold text-primary hover:underline">
            Ver blog →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <a
              key={p.id}
              href={p.external_url ?? "#"}
              target={p.external_url ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              {p.cover_url && (
                <img
                  src={p.cover_url}
                  alt={p.title}
                  className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="p-4">
                <h3 className="font-display text-lg uppercase leading-tight text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// suppress unused import warning
void useServerFn;
