import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import {
  createReview,
  getReviewEligibility,
  listProductReviews,
  type PublicReview,
} from "@/lib/reviews.functions";
import {
  ReviewMediaUpload,
  type ReviewMediaItem,
} from "@/components/reviews/ReviewMediaUpload";

function Stars({ value, size = 4 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-${size} w-${size} ${
            n <= filled ? "fill-primary text-primary" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductReviewsSummary({ average, count }: { average: number; count: number }) {
  if (count === 0) {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Stars value={0} />
        <span>Sem avaliações ainda</span>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 text-sm">
      <Stars value={average} />
      <span className="font-semibold text-foreground">{average.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({count} {count === 1 ? "avaliação" : "avaliações"})
      </span>
    </div>
  );
}

export function ProductReviewsSection({ productId }: { productId: string }) {
  const { user, loading: authLoading } = useAuth();
  const listFn = useServerFn(listProductReviews);
  const eligFn = useServerFn(getReviewEligibility);
  const createFn = useServerFn(createReview);

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    alreadyReviewed: boolean;
    orderId: string | null;
  } | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const { reviews } = await listFn({ data: { productId } });
      setReviews(reviews);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [productId]);

  useEffect(() => {
    if (authLoading || !user) {
      setEligibility(null);
      return;
    }
    eligFn({ data: { productId } })
      .then(setEligibility)
      .catch(() => setEligibility(null));
  }, [authLoading, user?.id, productId]);

  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="font-display text-2xl uppercase tracking-wide text-foreground">
        Avaliações de quem comprou
      </h2>

      {authLoading ? null : !user ? (
        <p className="mt-3 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Entre
          </Link>{" "}
          para avaliar produtos que você recebeu.
        </p>
      ) : eligibility?.canReview && eligibility.orderId ? (
        <NewReviewForm
          productId={productId}
          orderId={eligibility.orderId}
          userId={user.id}
          onCreated={async () => {
            await refresh();
            setEligibility({ canReview: false, alreadyReviewed: true, orderId: null });
          }}
          onSubmit={createFn}
        />
      ) : eligibility?.alreadyReviewed ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Você já avaliou este produto. Obrigado!
        </p>
      ) : null}

      {loading ? (
        <Loader2 className="mt-6 h-5 w-5 animate-spin text-muted-foreground" />
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Ainda não há avaliações para este produto.
        </p>
      ) : (
        <ul className="mt-6 space-y-6">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({ review }: { review: PublicReview }) {
  const [active, setActive] = useState(0);
  const activeMedia = review.media[active];
  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Stars value={review.rating} />
        <span className="font-semibold text-foreground">{review.author_name}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary">
          <ShieldCheck className="h-3 w-3" /> Compra verificada
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>
      {review.comment && (
        <p className="whitespace-pre-line text-sm text-foreground/85">{review.comment}</p>
      )}
      {review.media.length > 0 && (
        <div className="mt-3">
          <div className="overflow-hidden rounded-md border border-border bg-muted">
            {activeMedia?.media_type === "video" ? (
              <video
                key={activeMedia.id}
                src={activeMedia.media_url}
                controls
                playsInline
                className="max-h-80 w-full bg-black object-contain"
              />
            ) : (
              <img
                src={activeMedia?.media_url}
                alt=""
                className="max-h-80 w-full object-contain"
              />
            )}
          </div>
          {review.media.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {review.media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-14 w-14 overflow-hidden rounded border-2 ${
                    i === active ? "border-primary" : "border-transparent"
                  }`}
                >
                  {m.media_type === "video" ? (
                    <div className="relative h-full w-full bg-black">
                      <video
                        src={m.media_url}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                        ▶
                      </span>
                    </div>
                  ) : (
                    <img src={m.media_url} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function NewReviewForm({
  productId,
  orderId,
  userId,
  onCreated,
  onSubmit,
}: {
  productId: string;
  orderId: string;
  userId: string;
  onCreated: () => void;
  onSubmit: (args: { data: any }) => Promise<any>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<ReviewMediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSaving(true);
    try {
      await onSubmit({
        data: {
          productId,
          orderId,
          rating,
          comment: comment.trim() || undefined,
          media: media.map((m) => ({ url: m.url, type: m.type })),
        },
      });
      toast.success("Avaliação enviada. Obrigado!");
      setComment("");
      setMedia([]);
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao enviar avaliação");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-3">
        <div className="mb-1 font-display text-sm uppercase tracking-wide">
          Deixe sua avaliação
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} estrelas`}
              className="p-0.5"
            >
              <Star
                className={`h-6 w-6 transition ${
                  n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte sua experiência com o produto (opcional)"
        rows={4}
      />
      <div className="mt-3">
        <ReviewMediaUpload
          userId={userId}
          value={media}
          onChange={setMedia}
          subfolder={`draft-${productId}`}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar avaliação
        </Button>
      </div>
    </form>
  );
}
