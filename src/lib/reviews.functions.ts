import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export type PublicReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  author_name: string;
  media: { id: string; media_url: string; media_type: "image" | "video"; order_index: number }[];
};

function shortenName(full: string | null | undefined): string {
  const name = (full ?? "").trim();
  if (!name) return "Cliente";
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// -------- PUBLIC: list reviews for a product --------
export const listProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ reviews: PublicReview[]; average: number; count: number }> => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, user_id, rating, comment, created_at")
      .eq("product_id", data.productId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const reviews = rows ?? [];
    if (reviews.length === 0) return { reviews: [], average: 0, count: 0 };

    const userIds = Array.from(new Set(reviews.map((r) => r.user_id)));
    const reviewIds = reviews.map((r) => r.id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const { data: media } = await supabase
      .from("product_review_media")
      .select("id, review_id, media_url, media_type, order_index")
      .in("review_id", reviewIds)
      .order("order_index");
    const mediaByReview = new Map<string, PublicReview["media"]>();
    for (const m of media ?? []) {
      const arr = mediaByReview.get(m.review_id) ?? [];
      arr.push({
        id: m.id,
        media_url: m.media_url,
        media_type: m.media_type as "image" | "video",
        order_index: m.order_index,
      });
      mediaByReview.set(m.review_id, arr);
    }

    const enriched: PublicReview[] = reviews.map((r) => ({
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      author_name: shortenName(nameMap.get(r.user_id) ?? null),
      media: mediaByReview.get(r.id) ?? [],
    }));

    const sum = enriched.reduce((s, r) => s + r.rating, 0);
    return {
      reviews: enriched,
      average: sum / enriched.length,
      count: enriched.length,
    };
  });

// -------- AUTH: eligibility to review --------
export const getReviewEligibility = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Existing review by this user for this product?
    const { data: existing } = await supabaseAdmin
      .from("product_reviews")
      .select("id")
      .eq("user_id", context.userId)
      .eq("product_id", data.productId)
      .maybeSingle();

    if (existing) {
      return { canReview: false, alreadyReviewed: true, orderId: null as string | null };
    }

    // Find any delivered order containing this product for this user
    const { data: rows } = await supabaseAdmin
      .from("order_items")
      .select("order_id, orders!inner(id, user_id, status)")
      .eq("product_id", data.productId)
      .eq("orders.user_id", context.userId)
      .eq("orders.status", "delivered" as any)
      .limit(1);

    const orderId = rows && rows.length > 0 ? rows[0].order_id : null;
    return { canReview: Boolean(orderId), alreadyReviewed: false, orderId };
  });

// -------- AUTH: create review --------
const createReviewInput = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(4000).optional(),
  media: z
    .array(
      z.object({
        url: z.string().url().max(1000),
        type: z.enum(["image", "video"]),
      }),
    )
    .max(10)
    .default([]),
});

export const createReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Server-side re-verify: order belongs to user, status delivered, contains product
    const { data: verify } = await supabaseAdmin
      .from("order_items")
      .select("id, orders!inner(id, user_id, status)")
      .eq("product_id", data.productId)
      .eq("order_id", data.orderId)
      .eq("orders.user_id", context.userId)
      .eq("orders.status", "delivered" as any)
      .limit(1);

    if (!verify || verify.length === 0) {
      throw new Error("Você só pode avaliar produtos de pedidos entregues.");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("product_reviews")
      .insert({
        product_id: data.productId,
        user_id: context.userId,
        order_id: data.orderId,
        rating: data.rating,
        comment: data.comment?.trim() || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.media.length > 0) {
      const rows = data.media.map((m, i) => ({
        review_id: inserted.id,
        media_url: m.url,
        media_type: m.type,
        order_index: i,
      }));
      const { error: mErr } = await supabaseAdmin
        .from("product_review_media")
        .insert(rows);
      if (mErr) throw new Error(mErr.message);
    }

    return { id: inserted.id };
  });

// -------- ADMIN: list all reviews --------
export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_reviews")
      .select(
        "id, rating, comment, created_at, user_id, product_id, product:products(id, name, slug)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    if (list.length === 0) return [];

    const userIds = Array.from(new Set(list.map((r) => r.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const reviewIds = list.map((r) => r.id);
    const { data: media } = await supabaseAdmin
      .from("product_review_media")
      .select("id, review_id, media_url, media_type, order_index")
      .in("review_id", reviewIds)
      .order("order_index");
    const mediaByReview = new Map<string, any[]>();
    for (const m of media ?? []) {
      const arr = mediaByReview.get(m.review_id) ?? [];
      arr.push(m);
      mediaByReview.set(m.review_id, arr);
    }

    return list.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      user_id: r.user_id,
      product: r.product as any,
      author_name: (nameMap.get(r.user_id) ?? "Cliente") as string,
      media: mediaByReview.get(r.id) ?? [],
    }));
  });

// -------- ADMIN: delete review --------
export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort cleanup of storage objects
    const { data: media } = await supabaseAdmin
      .from("product_review_media")
      .select("media_url")
      .eq("review_id", data.id);
    const paths: string[] = [];
    const marker = "/object/public/review-media/";
    for (const m of media ?? []) {
      const i = m.media_url.indexOf(marker);
      if (i !== -1) paths.push(m.media_url.slice(i + marker.length));
    }
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("review-media").remove(paths);
    }

    const { error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
