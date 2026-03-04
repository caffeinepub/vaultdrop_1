import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Globe,
  Heart,
  Link2,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Listing } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import {
  useGetCallerWishlist,
  useGetListings,
  useRemoveFromWishlist,
  useSetWishlistVisibility,
} from "../../hooks/useQueries";
import { useGetCallerUserProfile } from "../../hooks/useQueries";

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function DashboardWishlist() {
  const { data: wishlist, isLoading: wishlistLoading } = useGetCallerWishlist();
  const { data: backendListings, isLoading: listingsLoading } =
    useGetListings();
  const { data: userProfile } = useGetCallerUserProfile();
  const removeFromWishlist = useRemoveFromWishlist();
  const setVisibility = useSetWishlistVisibility();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const listings = useMemo(() => {
    return backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);
  }, [backendListings]);

  const wishlistedListings = useMemo(() => {
    if (!wishlist?.listingIds) return [];
    return wishlist.listingIds
      .map((id) => listings.find((l) => l.id === id))
      .filter((l): l is Listing => !!l);
  }, [wishlist, listings]);

  const isPublic = wishlist?.isPublic ?? false;
  const isLoading = wishlistLoading || listingsLoading;

  const shareableUrl = useMemo(() => {
    if (!userProfile?.id) return null;
    return `${window.location.origin}/wishlist/${userProfile.id}`;
  }, [userProfile]);

  const handleRemove = async (listingId: string) => {
    setRemovingId(listingId);
    try {
      await removeFromWishlist.mutateAsync(listingId);
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    try {
      await setVisibility.mutateAsync(checked);
      toast.success(
        checked ? "Wishlist is now public" : "Wishlist is now private",
      );
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const handleCopyLink = async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
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
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground">
            Wishlist
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Your saved listings
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visibility control */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/50"
          >
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-display font-bold text-foreground">
                  {isPublic ? "Public Wishlist" : "Private Wishlist"}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {isPublic
                    ? "Anyone with the link can view your wishlist"
                    : "Only you can see your wishlist"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label
                htmlFor="wishlist-visibility"
                className="text-xs font-body text-muted-foreground cursor-pointer"
              >
                {isPublic ? "Public" : "Private"}
              </Label>
              <Switch
                id="wishlist-visibility"
                data-ocid="wishlist.switch"
                checked={isPublic}
                onCheckedChange={handleVisibilityToggle}
                disabled={setVisibility.isPending}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </motion.div>

          {/* Shareable link — only when public */}
          <AnimatePresence>
            {isPublic && shareableUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                  <Link2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs font-mono text-muted-foreground flex-1 truncate">
                    {shareableUrl}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    data-ocid="wishlist.secondary_button"
                    onClick={handleCopyLink}
                    className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 font-display font-semibold text-xs"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wishlist items */}
          {wishlistedListings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
              data-ocid="wishlist.empty_state"
            >
              <div className="p-4 rounded-full bg-muted/40 border border-border/40">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground">
                Your wishlist is empty
              </p>
              <p className="text-sm text-muted-foreground font-body text-center max-w-xs">
                Browse listings to add some.
              </p>
              <Link to="/listings">
                <Button
                  variant="outline"
                  data-ocid="wishlist.button"
                  className="border-primary/30 text-primary hover:bg-primary/10 font-display font-semibold mt-2"
                >
                  Browse Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border/60 overflow-hidden"
              data-ocid="wishlist.list"
            >
              <AnimatePresence initial={false}>
                {wishlistedListings.map((listing, i) => {
                  const imageSrc = listing.previewImageKey?.startsWith("/")
                    ? listing.previewImageKey
                    : null;
                  return (
                    <motion.div
                      key={listing.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ duration: 0.25 }}
                      data-ocid={`wishlist.item.${i + 1}`}
                      className="flex items-center gap-4 px-4 py-3.5 border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted/60 border border-border/40">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5">
                          {formatPrice(listing.price)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to="/listings/$listingId"
                          params={{ listingId: listing.id }}
                          data-ocid="wishlist.link"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-primary/25 text-primary hover:bg-primary/10 font-display font-semibold text-xs"
                          >
                            View
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`wishlist.delete_button.${i + 1}`}
                          onClick={() => handleRemove(listing.id)}
                          disabled={removingId === listing.id}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          {removingId === listing.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
