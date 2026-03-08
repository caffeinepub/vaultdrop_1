import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Lock,
  MessageSquare,
  ShoppingCart,
  Star,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type DiscountCode,
  type Listing,
  ListingStatus,
  OrderStatus,
} from "../backend";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ShareToolbar from "../components/ShareToolbar";
import { SAMPLE_LISTINGS } from "../data/sampleListings";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCheckoutSession,
  useCreateOrder,
  useGetApprovedReviews,
  useGetListings,
  useGetStripeSessionStatus,
  useGetUserOrders,
  useSubmitReview,
  useUpdateOrderStatus,
  useValidateDiscountCode,
} from "../hooks/useQueries";

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Star Rating Component ─────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={
              readonly
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 transition-transform"
            }
          >
            <Star
              className={`${sizeClass} transition-colors duration-150 ${
                filled
                  ? "text-warning fill-warning"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  listingId: string;
  isAuthenticated: boolean;
  hasCompletedOrder: boolean;
}

function ReviewsSection({
  listingId,
  isAuthenticated,
  hasCompletedOrder,
}: ReviewsSectionProps) {
  const {
    data: reviews,
    isLoading,
    isError,
  } = useGetApprovedReviews(listingId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    return (
      reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
    );
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }
    try {
      await submitReview.mutateAsync({
        listingId,
        rating: BigInt(rating),
        comment: comment.trim(),
      });
      toast.success("Review submitted! It will appear after moderation.");
      setComment("");
      setRating(5);
      setShowForm(false);
    } catch {
      toast.error("Failed to submit review. Have you purchased this product?");
    }
  };

  return (
    <section
      className="mt-16 pt-12 border-t border-border/40"
      data-ocid="reviews.section"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-black text-foreground">
            Reviews
          </h2>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <StarRating value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm font-display font-bold text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground font-body">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {isAuthenticated && hasCompletedOrder && !showForm && (
          <Button
            size="sm"
            variant="outline"
            data-ocid="reviews.open_modal_button"
            onClick={() => setShowForm(true)}
            className="border-primary/30 text-primary hover:bg-primary/10 font-display font-semibold"
          >
            <Star className="h-3.5 w-3.5 mr-1.5" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Write review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mb-8 p-5 rounded-xl border border-primary/20 bg-primary/5"
            data-ocid="reviews.panel"
          >
            <h3 className="font-display font-bold text-foreground mb-4">
              Your Review
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Rating
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <label
                  htmlFor="review-comment"
                  className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2 block"
                >
                  Comment
                </label>
                <Textarea
                  id="review-comment"
                  data-ocid="reviews.textarea"
                  placeholder="Share your experience with this product…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="bg-background/50 border-border/60 font-body resize-none focus:border-primary/40"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  data-ocid="reviews.submit_button"
                  disabled={submitReview.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold"
                >
                  {submitReview.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
                <Button
                  type="button"
                  data-ocid="reviews.cancel_button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="font-display font-semibold text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4" data-ocid="reviews.loading_state">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/40 space-y-2"
            >
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-muted-foreground font-body"
          data-ocid="reviews.error_state"
        >
          Failed to load reviews.
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 gap-3 text-center"
          data-ocid="reviews.empty_state"
        >
          <div className="p-3 rounded-full bg-muted/40 border border-border/40">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground">
            No reviews yet
          </p>
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            {isAuthenticated && hasCompletedOrder
              ? "Be the first to review this product."
              : "Purchase this product to leave a review."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-ocid={`reviews.item.${i + 1}`}
              className="p-5 rounded-xl border border-border/40 bg-card/50"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-display font-black text-primary">
                    {review.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-foreground">
                      {review.userId.length > 16
                        ? `${review.userId.slice(0, 12)}…`
                        : review.userId}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-body">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <StarRating value={Number(review.rating)} readonly size="sm" />
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mt-3">
                {review.comment}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const { listingId } = useParams({ from: "/listings/$listingId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Check for returning Stripe session
  const searchParams = useSearch({ strict: false }) as { session_id?: string };
  const sessionId = searchParams.session_id;

  const { data: backendListings, isLoading } = useGetListings();
  const { data: userOrders } = useGetUserOrders();
  const createCheckout = useCreateCheckoutSession();
  const getSessionStatus = useGetStripeSessionStatus();
  const createOrder = useCreateOrder();
  const updateOrderStatus = useUpdateOrderStatus();
  const validateDiscount = useValidateDiscountCode();

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(
    null,
  );
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Find listing
  const listing = useMemo((): Listing | null => {
    if (backendListings && backendListings.length > 0) {
      return backendListings.find((l) => l.id === listingId) ?? null;
    }
    const sample = SAMPLE_LISTINGS.find((l) => l.id === listingId);
    return sample ? (sample as unknown as Listing) : null;
  }, [backendListings, listingId]);

  // Check if user has a completed order for this listing
  const hasCompletedOrder = useMemo(() => {
    if (!userOrders) return false;
    return userOrders.some(
      (o) => o.listingId === listingId && o.status === OrderStatus.completed,
    );
  }, [userOrders, listingId]);

  // Handle returning from Stripe — use ref to avoid repeated processing
  const processedSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!sessionId || !listing || processedSessionRef.current === sessionId)
      return;
    processedSessionRef.current = sessionId;

    void (async () => {
      try {
        const status = await getSessionStatus.mutateAsync(sessionId);
        if (status.__kind__ === "completed") {
          const response = JSON.parse(
            (
              status as {
                __kind__: "completed";
                completed: { response: string };
              }
            ).completed.response,
          );
          const paymentIntentId =
            (response as { payment_intent?: string })?.payment_intent ?? null;
          const order = await createOrder.mutateAsync({
            listingId: listing.id,
            amount: listing.price,
            paymentIntentId,
            discountCode: null,
          });
          await updateOrderStatus.mutateAsync({
            orderId: order.id,
            status: OrderStatus.completed,
          });
          toast.success("Purchase complete! Check your downloads.");
        } else if (status.__kind__ === "failed") {
          toast.error(
            `Payment failed: ${(status as { __kind__: "failed"; failed: { error: string } }).failed.error}`,
          );
        }
      } catch (err) {
        console.error("Failed to process payment return", err);
      }
    })();
  }, [sessionId, listing, getSessionStatus, createOrder, updateOrderStatus]);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setDiscountError(null);
    try {
      const result = await validateDiscount.mutateAsync(
        discountInput.trim().toUpperCase(),
      );
      if (result.__kind__ === "ok") {
        setAppliedDiscount(result.ok);
        setDiscountError(null);
      } else {
        setAppliedDiscount(null);
        setDiscountError(result.error);
      }
    } catch {
      setDiscountError("Failed to validate code. Please try again.");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  };

  const discountedPrice =
    appliedDiscount && listing
      ? listing.price - (listing.price * appliedDiscount.discountPercent) / 100n
      : null;

  const finalPrice = discountedPrice ?? listing?.price ?? 0n;

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to purchase");
      return;
    }
    if (!listing) return;

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/listings/${listingId}?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/listings/${listingId}`;

      const session = await createCheckout.mutateAsync({
        items: [
          {
            productName: listing.title,
            productDescription: listing.description.slice(0, 200),
            priceInCents: finalPrice,
            quantity: 1n,
            currency: "usd",
          },
        ],
        successUrl,
        cancelUrl,
      });

      if (!session?.url) throw new Error("Stripe session missing url");
      window.location.href = session.url;
    } catch (err) {
      toast.error("Failed to start checkout. Is Stripe configured?");
      console.error(err);
    }
  };

  const isUpcoming = listing?.status === ListingStatus.upcoming;
  const isProcessing = createCheckout.isPending || getSessionStatus.isPending;
  const justPurchased = createOrder.isSuccess;

  // Image src
  const imageSrc = listing?.previewImageKey?.startsWith("/")
    ? listing.previewImageKey
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate({ to: "/listings" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body mb-8 transition-colors"
            data-ocid="listing.link"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </button>

          {isLoading ? (
            <div className="grid lg:grid-cols-2 gap-12">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : !listing ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground font-body">
                Listing not found.
              </p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid lg:grid-cols-2 gap-12"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/60 bg-muted">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <Download className="h-16 w-16 text-primary/20" />
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="h-12 w-12 text-warning mx-auto mb-3" />
                        <p className="font-display font-bold text-warning text-lg">
                          Subscriber Early Access
                        </p>
                        <p className="text-sm text-muted-foreground font-body mt-1">
                          Subscribe to unlock before public release
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-5">
                  {/* Status */}
                  {isUpcoming && (
                    <Badge className="w-fit bg-warning/15 text-warning border-warning/30 font-display font-semibold">
                      <Clock className="h-3 w-3 mr-1.5" />
                      Coming Soon — Subscriber Early Access
                    </Badge>
                  )}

                  <div>
                    <h1 className="text-3xl md:text-4xl font-display font-black text-foreground leading-tight">
                      {listing.title}
                    </h1>
                    <p className="mt-4 text-muted-foreground font-body leading-relaxed">
                      {listing.description}
                    </p>
                  </div>

                  {/* Share toolbar */}
                  <div data-ocid="listing.share_toolbar">
                    <ShareToolbar
                      title={listing.title}
                      url={window.location.href.split("?")[0]}
                    />
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    {appliedDiscount ? (
                      <>
                        <span className="text-4xl font-display font-black text-primary glow-text">
                          {formatPrice(finalPrice)}
                        </span>
                        <span className="text-xl font-display font-semibold text-muted-foreground line-through">
                          {formatPrice(listing.price)}
                        </span>
                        <span className="text-sm font-display font-bold text-green-500">
                          -{Number(appliedDiscount.discountPercent)}% off
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-display font-black text-primary glow-text">
                          {formatPrice(listing.price)}
                        </span>
                        <span className="text-sm text-muted-foreground font-body">
                          one-time
                        </span>
                      </>
                    )}
                  </div>

                  {/* Discount code input */}
                  {!justPurchased && !isUpcoming && (
                    <div className="space-y-2">
                      {appliedDiscount ? (
                        <div
                          data-ocid="checkout.discount_success_state"
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{
                            background: "oklch(0.72 0.17 160 / 0.08)",
                            borderColor: "oklch(0.72 0.17 160 / 0.3)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Tag
                              className="h-3.5 w-3.5"
                              style={{ color: "oklch(0.72 0.17 160)" }}
                            />
                            <span
                              className="text-sm font-display font-bold"
                              style={{ color: "oklch(0.72 0.17 160)" }}
                            >
                              {appliedDiscount.code}
                            </span>
                            <span
                              className="text-xs font-body"
                              style={{ color: "oklch(0.72 0.17 160)" }}
                            >
                              {Number(appliedDiscount.discountPercent)}% off
                              applied
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveDiscount}
                            className="p-1 rounded hover:bg-muted/40 transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            data-ocid="checkout.discount_input"
                            value={discountInput}
                            onChange={(e) => {
                              setDiscountInput(e.target.value.toUpperCase());
                              setDiscountError(null);
                            }}
                            placeholder="Discount code"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleApplyDiscount();
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors uppercase tracking-wider"
                          />
                          <button
                            type="button"
                            data-ocid="checkout.apply_discount_button"
                            onClick={() => void handleApplyDiscount()}
                            disabled={
                              validateDiscount.isPending ||
                              !discountInput.trim()
                            }
                            className="px-4 py-2 rounded-lg text-sm font-display font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            {validateDiscount.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Tag className="h-3.5 w-3.5" />
                            )}
                            Apply
                          </button>
                        </div>
                      )}
                      {discountError && (
                        <p
                          data-ocid="checkout.discount_error_state"
                          className="text-xs font-body text-destructive flex items-center gap-1.5"
                        >
                          <X className="h-3 w-3 shrink-0" />
                          {discountError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Purchase */}
                  {justPurchased ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-display font-bold text-sm text-foreground">
                          Purchase complete!
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5">
                          Your download is ready in your dashboard.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate({ to: "/dashboard/downloads" })}
                        className="ml-auto font-display font-semibold text-primary hover:text-primary"
                        data-ocid="listing.secondary_button"
                      >
                        View Downloads
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handlePurchase}
                      disabled={isProcessing || isUpcoming}
                      data-ocid="listing.primary_button"
                      className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold text-base"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing…
                        </>
                      ) : isUpcoming ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Subscribe for Early Access
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy Now — {formatPrice(finalPrice)}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Features */}
                  <div className="mt-2 space-y-2">
                    {[
                      "Instant digital download",
                      "Lifetime access",
                      "Secure checkout via Stripe",
                    ].map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 text-sm font-body text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary/60 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Reviews Section */}
              <ReviewsSection
                listingId={listingId}
                isAuthenticated={isAuthenticated}
                hasCompletedOrder={hasCompletedOrder}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
