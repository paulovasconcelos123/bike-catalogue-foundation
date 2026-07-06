import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listBlogPosts } from "@/lib/catalog.functions";

const postsKey = queryOptions({
  queryKey: ["blog-posts"],
  queryFn: () => listBlogPosts(),
});

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Paulo Bicicletas" },
      {
        name: "description",
        content: "Dicas de pedal, manutenção e vídeos do dia a dia da loja.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(postsKey);
  },
  component: BlogPage,
});

function BlogPage() {
  const posts = useSuspenseQuery(postsKey).data;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl uppercase sm:text-4xl">Blog & Conteúdo</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Dicas rápidas, vídeos do TikTok e conteúdos que a gente publica pra ajudar você a pedalar
        melhor.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
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
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(p.published_at).toLocaleDateString("pt-BR")}
              </p>
              <h2 className="mt-1 font-display text-xl uppercase text-foreground">{p.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{p.excerpt}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-primary">
                Ler mais →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
