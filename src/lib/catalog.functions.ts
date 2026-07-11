import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

export type CategoryWithSubs = {
  id: string;
  slug: string;
  name: string;
  sort: number;
  subcategories: { id: string; slug: string; name: string; sort: number }[];
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  stock: number;
  description: string;
  images: string[];
  video_url: string | null;
  featured: boolean;
  category: { id: string; slug: string; name: string };
  subcategory: { id: string; slug: string; name: string } | null;
};


export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  excerpt: string;
  external_url: string | null;
  published_at: string;
};

export const getCategoriesWithSubs = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryWithSubs[]> => {
    const supabase = publicClient();
    const { data: cats, error: catErr } = await supabase
      .from("categories")
      .select("id, slug, name, sort")
      .order("sort");
    if (catErr) throw new Error(catErr.message);
    const { data: subs, error: subErr } = await supabase
      .from("subcategories")
      .select("id, slug, name, sort, category_id")
      .order("sort");
    if (subErr) throw new Error(subErr.message);
    return (cats ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      sort: c.sort,
      subcategories: (subs ?? [])
        .filter((s) => s.category_id === c.id)
        .map(({ id, slug, name, sort }) => ({ id, slug, name, sort })),
    }));
  },
);

export const getFeaturedProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProductRow[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, price_cents, stock, description, images, video_url, featured, category:categories(id, slug, name), subcategory:subcategories(id, slug, name)",
      )
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ProductRow[];
  },
);

const listProductsInput = z.object({
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  sort: z.enum(["relevancia", "preco-asc", "preco-desc"]).default("relevancia"),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input) => listProductsInput.parse(input))
  .handler(async ({ data }): Promise<ProductRow[]> => {
    const supabase = publicClient();
    let query = supabase
      .from("products")
      .select(
        "id, slug, name, price_cents, stock, description, images, video_url, featured, category:categories!inner(id, slug, name), subcategory:subcategories(id, slug, name)",
      );

    if (data.categoria) {
      query = query.eq("category.slug", data.categoria);
    }
    if (data.subcategoria) {
      // subcategory may be null; use inner join by re-selecting when filtered
      const { data: rows, error } = await supabase
        .from("products")
        .select(
          "id, slug, name, price_cents, stock, description, images, video_url, featured, category:categories!inner(id, slug, name), subcategory:subcategories!inner(id, slug, name)",
        )
        .eq("subcategory.slug", data.subcategoria)
        .order(
          data.sort === "preco-asc"
            ? "price_cents"
            : data.sort === "preco-desc"
              ? "price_cents"
              : "featured",
          { ascending: data.sort !== "preco-desc" && data.sort !== "relevancia" },
        );
      if (error) throw new Error(error.message);
      return (rows ?? []) as unknown as ProductRow[];
    }

    if (data.sort === "preco-asc") query = query.order("price_cents", { ascending: true });
    else if (data.sort === "preco-desc") query = query.order("price_cents", { ascending: false });
    else query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as ProductRow[];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }): Promise<ProductRow | null> => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, price_cents, stock, description, images, video_url, featured, category:categories(id, slug, name), subcategory:subcategories(id, slug, name)",
      )

      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as unknown as ProductRow | null;
  });

export const listBlogPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPost[]> => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, cover_url, excerpt, external_url, published_at")
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as BlogPost[];
  },
);
