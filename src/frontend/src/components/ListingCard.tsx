import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Heart, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Listing, ListingStatus } from "../backend";
import type { SampleListing } from "../data/sampleListings";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddToWishlist,
  useGetCallerWishlist,
  useRemoveFromWishlist,
} from "../hooks/useQueries";

type ListingCardData = Listing | SampleListing;

interface ListingCardProps {
  listing: ListingCardData;
  index?: number;
}

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function getStatusBadge(status: ListingStatus) {
  switch (status) {
    case ListingStatus.published:
      return null;
    case ListingStatus.upcoming:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-warning/20 text-warning border border-warning/30 backdrop-blur-sm">
          <Clock className="h-2.5 w-2.5" />
          Early Access
        </span>
      );
    case ListingStatus.draft:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-muted text-muted-foreground border border-border/40">
          Draft
        </span>
      );
  }
}

// Pull category from SampleListing if present
function getCategory(listing: ListingCardData): string | null {
  return "category" in listing ? (listing.category as string) : null;
}

export default function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const isUpcoming = listing.status === ListingStatus.upcoming;
  const category = getCategory(listing);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: wishlist } = useGetCallerWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const isWishlisted = wishlist?.listingIds?.includes(listing.id) ?? false;
  const [isAnimating, setIsAnimating] = useState(false);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Sign in to save to your wishlist");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    try {
      if (isWishlisted) {
        await removeFromWishlist.mutateAsync(listing.id);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist.mutateAsync(listing.id);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const imageSrc =
    "previewImageKey" in listing && listing.previewImageKey
      ? listing.previewImageKey.startsWith("/")
        ? listing.previewImageKey
        : null
      : null;

  const cardIndex = index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        to="/listings/$listingId"
        params={{ listingId: listing.id }}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-glow hover:-translate-y-1 card-shimmer">
          {/* Preview image */}
          <div className="relative aspect-[3/2] overflow-hidden bg-muted">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
                {isUpcoming ? (
                  <Lock className="h-10 w-10 text-primary/25" />
                ) : (
                  <div className="h-12 w-12 rounded-full border-2 border-dashed border-primary/20" />
                )}
              </div>
            )}

            {/* Upcoming overlay */}
            {isUpcoming && (
              <div className="absolute inset-0 bg-background/65 backdrop-blur-[3px] flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="inline-flex p-2.5 rounded-full bg-warning/10 border border-warning/25 mb-2">
                    <Lock className="h-5 w-5 text-warning" />
                  </div>
                  <p className="text-xs font-display font-bold text-warning">
                    Subscriber Early Access
                  </p>
                </div>
              </div>
            )}

            {/* Top-left: status badge */}
            <div className="absolute top-2.5 left-2.5">
              {getStatusBadge(listing.status)}
            </div>

            {/* Top-right: wishlist toggle + category chip */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              {category && !isUpcoming && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-semibold bg-background/80 text-muted-foreground border border-border/50 backdrop-blur-sm">
                  {category}
                </span>
              )}
              <button
                type="button"
                data-ocid={`listing.wishlist_toggle.${cardIndex}`}
                onClick={handleWishlistToggle}
                disabled={
                  addToWishlist.isPending || removeFromWishlist.isPending
                }
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                className={[
                  "flex items-center justify-center w-7 h-7 rounded-full backdrop-blur-sm border transition-all duration-200",
                  "hover:scale-110 active:scale-95",
                  isWishlisted
                    ? "bg-destructive/20 border-destructive/40 text-destructive"
                    : "bg-background/70 border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10",
                  isAnimating ? "scale-125" : "",
                ].join(" ")}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-all duration-200 ${isWishlisted ? "fill-destructive" : ""}`}
                />
              </button>
            </div>

            {/* Bottom gradient for text legibility */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
          </div>

          {/* Content */}
          <div className="p-4 pt-3.5">
            <h3 className="font-display font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 leading-snug">
              {listing.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed">
              {listing.description}
            </p>

            <div className="mt-3.5 flex items-center justify-between">
              {/* Price chip */}
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 font-display font-black text-sm text-primary">
                {formatPrice(listing.price)}
              </span>
              {/* Arrow affordance */}
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 border border-border/40 text-muted-foreground group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:text-primary transition-all duration-200">
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
