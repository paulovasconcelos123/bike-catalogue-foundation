# Onda 1 — Fundação Paulo Bicicletas

Site institucional + catálogo navegável. Sem carrinho/checkout/login — botões "Comprar" ficam visíveis mas inativos, prontos para a Onda 2.

## Dados reais

- Endereço: R. Merendiba, 325 — Pontezinha, Cabo de Santo Agostinho - PE, 54589-050
- WhatsApp (footer + botão flutuante): (81) 98621-8601 → link `https://wa.me/5581986218601`
- Instagram/TikTok: @paulobicicletas

## Identidade visual

- Tokens em `src/styles.css` (oklch) mapeados para Tailwind:
  - `--mocha #1e1817` (foreground)
  - `--kombu #283618` (secundária)
  - `--brick #ee7828` (primary/CTA — único uso do laranja)
  - `--background #ffffff`, `--muted #f5f5f4`
- Fontes via `<link>` em `__root.tsx`: Oswald (títulos condensados) + Montserrat (corpo). Tokens `--font-display` e `--font-sans`.
- Logos enviados subidos via `lovable-assets` a partir de `/mnt/user-uploads/`:
  - Horizontal → header
  - Vertical → footer
  - Mono escuro → `public/favicon.png`, referenciado em `__root.tsx`; `favicon.ico` padrão removido.

## Backend (Lovable Cloud)

Habilitar Cloud e criar migração:

- `categories` (id, slug, name, sort)
- `subcategories` (id, category_id fk, slug, name, sort)
- `products` (id, name, slug, category_id, subcategory_id nullable, price_cents int, stock int, description text, images text[], featured bool, created_at)
- `blog_posts` (id, title, slug, cover_url, excerpt, external_url, published_at)
- RLS: SELECT público (`TO anon, authenticated`) em todas; sem escrita pública. GRANTs explícitos.
- Seed via migração: 5 categorias + subcategorias do brief + 8–10 produtos exemplo com imagens Unsplash + 2 posts de blog.

Leituras via server function pública (client `SUPABASE_PUBLISHABLE_KEY`) chamada pelos loaders — sem `requireSupabaseAuth` nesta etapa.

## Rotas (`src/routes/`)

- `__root.tsx` — head pt-BR (Oswald+Montserrat, favicon, meta/OG), Header fixo, Footer, WhatsApp flutuante.
- `index.tsx` — hero, grid de 8 destaques, tiles das 5 categorias, "Sobre" resumido, prévia de blog, CTA WhatsApp.
- `produtos.tsx` — layout com sidebar de filtros (accordion categoria → subcategorias) e `<Outlet />`.
- `produtos.index.tsx` — grid com ordenação (relevância / preço asc / desc); filtros via search params zod (`categoria`, `subcategoria`, `sort`).
- `produtos.$slug.tsx` — galeria, descrição, categoria/subcategoria, estoque, botão "Comprar" desabilitado com tooltip "Em breve".
- `sobre.tsx` — história (1997), missão, diferenciais, grid para fotos da loja (placeholders).
- `blog.tsx` — lista de posts/vídeos com capa, título, resumo, link externo.
- `contato.tsx` — formulário (validação client-side, envio simulado com toast), redes @paulobicicletas, endereço real, iframe do Google Maps para R. Merendiba 325.

Cada rota define `head()` próprio (title/description/og pt-BR). `errorComponent` e `notFoundComponent` em rotas com loader.

## Componentes (`src/components/`)

- `layout/Header.tsx`, `layout/Footer.tsx`, `layout/WhatsAppFab.tsx` (fixo bottom-right).
- `product/ProductCard.tsx`, `ProductGrid.tsx`, `CategoryFilter.tsx`, `ProductGallery.tsx`.
- `home/Hero.tsx`, `CategoryTiles.tsx`, `AboutTeaser.tsx`, `BlogTeaser.tsx`.

Reaproveita shadcn já instalado (button, card, sheet, accordion, input, badge, sonner, tooltip).

## Estilo e responsividade

- Mobile-first, container centralizado, grids `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`.
- CTA `bg-primary` (Brick). Superfícies branco/`bg-muted`. Texto Mocha, detalhes Kombu.
- Títulos `font-display uppercase tracking-tight`.
- Header segue padrão responsive-layout (grid + `min-w-0` + `shrink-0`).

## Fora de escopo (Onda 2)

Carrinho funcional, checkout, pagamento, auth de cliente, painel admin, envio real do formulário.
