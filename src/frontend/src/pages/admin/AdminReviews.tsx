import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Inbox,
  Loader2,
  MessageSquareDot,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type Listing, type Review, ReviewStatus } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import {
  useDeleteReview,
  useGetAllReviews,
  useGetListings,
  useModerateReview,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";
const adminBg = "oklch(0.12 0.007 50)";

type FilterTab = "all" | ReviewStatus;

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StarDisplay({ rating }: { rating: bigint }) {
  const val = Number(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= val ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<
    ReviewStatus,
    { bg: string; text: string; border: string; label: string }
  > = {
    [ReviewStatus.pending]: {
      bg: "oklch(0.82 0.18 75 / 0.15)",
      text: "oklch(0.82 0.18 75)",
      border: "oklch(0.82 0.18 75 / 0.3)",
      label: "Pending",
    },
    [ReviewStatus.approved]: {
      bg: "oklch(0.72 0.17 160 / 0.15)",
      text: "oklch(0.72 0.17 160)",
      border: "oklch(0.72 0.17 160 / 0.3)",
      label: "Approved",
    },
    [ReviewStatus.rejected]: {
      bg: "oklch(0.6 0.22 25 / 0.15)",
      text: "oklch(0.6 0.22 25)",
      border: "oklch(0.6 0.22 25 / 0.3)",
      label: "Rejected",
    },
  };

  const s = styles[status];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-display font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: ReviewStatus.pending },
  { label: "Approved", value: ReviewStatus.approved },
  { label: "Rejected", value: ReviewStatus.rejected },
];

export default function AdminReviews() {
  const { data: reviews, isLoading } = useGetAllReviews();
  const { data: backendListings } = useGetListings();
  const moderateReview = useModerateReview();
  const deleteReview = useDeleteReview();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const listings = useMemo(
    () =>
      backendListings && backendListings.length > 0
        ? backendListings
        : (SAMPLE_LISTINGS as unknown as Listing[]),
    [backendListings],
  );

  const getListingTitle = (id: string) =>
    listings.find((l) => l.id === id)?.title ?? id;

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    if (activeFilter === "all") return reviews;
    return reviews.filter((r) => r.status === activeFilter);
  }, [reviews, activeFilter]);

  const counts = useMemo(() => {
    if (!reviews) return { all: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      all: reviews.length,
      pending: reviews.filter((r) => r.status === ReviewStatus.pending).length,
      approved: reviews.filter((r) => r.status === ReviewStatus.approved)
        .length,
      rejected: reviews.filter((r) => r.status === ReviewStatus.rejected)
        .length,
    };
  }, [reviews]);

  const handleApprove = async (reviewId: string) => {
    setActioningId(reviewId);
    try {
      await moderateReview.mutateAsync({
        reviewId,
        status: ReviewStatus.approved,
      });
      toast.success("Review approved");
    } catch {
      toast.error("Failed to approve review");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (reviewId: string) => {
    setActioningId(reviewId);
    try {
      await moderateReview.mutateAsync({
        reviewId,
        status: ReviewStatus.rejected,
      });
      toast.success("Review rejected");
    } catch {
      toast.error("Failed to reject review");
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActioningId(deleteTarget.id);
    try {
      await deleteReview.mutateAsync(deleteTarget.id);
      toast.success("Review deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <MessageSquareDot className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Reviews
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          Moderate user reviews across all listings
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg mb-6 w-fit"
        style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        data-ocid="reviews.tab"
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              data-ocid={`reviews.${tab.value}.tab`}
              onClick={() => setActiveFilter(tab.value)}
              className="px-3.5 py-1.5 rounded-md text-xs font-display font-semibold transition-all flex items-center gap-1.5"
              style={
                isActive
                  ? {
                      background: "oklch(0.78 0.19 65 / 0.15)",
                      color: adminGold,
                      border: "1px solid oklch(0.78 0.19 65 / 0.3)",
                    }
                  : { color: adminMuted, border: "1px solid transparent" }
              }
            >
              {tab.label}
              <span
                className="px-1.5 py-px rounded-full text-[10px] font-mono"
                style={{
                  background: isActive
                    ? "oklch(0.78 0.19 65 / 0.15)"
                    : "oklch(0.22 0.015 50)",
                  color: isActive ? adminGold : adminMuted,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="reviews.loading_state">
          {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          data-ocid="reviews.empty_state"
        >
          <Inbox className="h-10 w-10" style={{ color: adminMuted }} />
          <p className="font-display font-semibold" style={{ color: adminFg }}>
            No reviews found
          </p>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            {activeFilter === "all"
              ? "No reviews submitted yet"
              : `No ${activeFilter} reviews`}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${adminBorder}` }}
          data-ocid="reviews.table"
        >
          {/* Table header */}
          <div
            className="grid gap-3 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
            style={{
              background: adminCard,
              color: adminMuted,
              gridTemplateColumns: "1.5fr 140px 70px 2fr 110px 100px 120px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Listing</span>
            <span>Reviewer</span>
            <span>Rating</span>
            <span>Comment</span>
            <span>Status</span>
            <span>Date</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          {filteredReviews.map((review: Review, i) => (
            <div
              key={review.id}
              data-ocid={`reviews.row.${i + 1}`}
              className="grid gap-3 px-5 py-4 items-center"
              style={{
                gridTemplateColumns: "1.5fr 140px 70px 2fr 110px 100px 120px",
                borderBottom:
                  i < filteredReviews.length - 1
                    ? `1px solid ${adminBorder}`
                    : "none",
                background:
                  i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
              }}
            >
              {/* Listing */}
              <p
                className="font-body text-sm truncate"
                style={{ color: adminFg }}
                title={getListingTitle(review.listingId)}
              >
                {getListingTitle(review.listingId)}
              </p>

              {/* Reviewer */}
              <p
                className="font-mono text-xs truncate"
                style={{ color: adminMuted }}
                title={review.userId}
              >
                {review.userId.slice(0, 14)}…
              </p>

              {/* Rating */}
              <StarDisplay rating={review.rating} />

              {/* Comment */}
              <p
                className="font-body text-sm line-clamp-2"
                style={{ color: adminMuted }}
                title={review.comment}
              >
                {review.comment}
              </p>

              {/* Status */}
              <StatusBadge status={review.status} />

              {/* Date */}
              <p className="font-body text-sm" style={{ color: adminMuted }}>
                {formatDate(review.createdAt)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                {review.status !== ReviewStatus.approved && (
                  <button
                    type="button"
                    data-ocid={`reviews.confirm_button.${i + 1}`}
                    onClick={() => handleApprove(review.id)}
                    disabled={actioningId === review.id}
                    title="Approve"
                    className="flex items-center justify-center w-7 h-7 rounded-md transition-all hover:opacity-80"
                    style={{
                      background: "oklch(0.72 0.17 160 / 0.15)",
                      border: "1px solid oklch(0.72 0.17 160 / 0.3)",
                    }}
                  >
                    {actioningId === review.id ? (
                      <Loader2
                        className="h-3 w-3 animate-spin"
                        style={{ color: "oklch(0.72 0.17 160)" }}
                      />
                    ) : (
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        style={{ color: "oklch(0.72 0.17 160)" }}
                      />
                    )}
                  </button>
                )}
                {review.status !== ReviewStatus.rejected && (
                  <button
                    type="button"
                    data-ocid={`reviews.cancel_button.${i + 1}`}
                    onClick={() => handleReject(review.id)}
                    disabled={actioningId === review.id}
                    title="Reject"
                    className="flex items-center justify-center w-7 h-7 rounded-md transition-all hover:opacity-80"
                    style={{
                      background: "oklch(0.82 0.18 75 / 0.12)",
                      border: "1px solid oklch(0.82 0.18 75 / 0.25)",
                    }}
                  >
                    {actioningId === review.id ? (
                      <Loader2
                        className="h-3 w-3 animate-spin"
                        style={{ color: "oklch(0.82 0.18 75)" }}
                      />
                    ) : (
                      <XCircle
                        className="h-3.5 w-3.5"
                        style={{ color: "oklch(0.82 0.18 75)" }}
                      />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  data-ocid={`reviews.delete_button.${i + 1}`}
                  onClick={() => setDeleteTarget(review)}
                  title="Delete"
                  className="flex items-center justify-center w-7 h-7 rounded-md transition-all hover:opacity-80"
                  style={{
                    background: "oklch(0.6 0.22 25 / 0.12)",
                    border: "1px solid oklch(0.6 0.22 25 / 0.25)",
                  }}
                >
                  <Trash2
                    className="h-3.5 w-3.5"
                    style={{ color: "oklch(0.6 0.22 25)" }}
                  />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          data-ocid="reviews.dialog"
          style={{
            background: adminCard,
            border: `1px solid ${adminBorder}`,
            color: adminFg,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: adminFg }}>Delete Review</DialogTitle>
            <DialogDescription style={{ color: adminMuted }}>
              This will permanently delete this review. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div
              className="rounded-lg p-4 my-2"
              style={{
                background: adminBg,
                border: `1px solid ${adminBorder}`,
              }}
            >
              <p
                className="text-sm font-body mb-2"
                style={{ color: adminMuted }}
              >
                {getListingTitle(deleteTarget.listingId)}
              </p>
              <p
                className="text-sm font-body line-clamp-3"
                style={{ color: adminFg }}
              >
                "{deleteTarget.comment}"
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              data-ocid="reviews.cancel_button"
              onClick={() => setDeleteTarget(null)}
              style={{ color: adminMuted }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="reviews.confirm_button"
              onClick={handleDeleteConfirm}
              disabled={deleteReview.isPending}
              style={{ background: "oklch(0.6 0.22 25)", color: "white" }}
            >
              {deleteReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
