import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileDown, Inbox, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Listing, OrderStatus } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import {
  useGetDownloadFileUrl,
  useGetListings,
  useGetUserOrders,
} from "../../hooks/useQueries";

export default function DashboardDownloads() {
  const { data: orders, isLoading: ordersLoading } = useGetUserOrders();
  const { data: backendListings } = useGetListings();
  const getDownloadUrl = useGetDownloadFileUrl();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const listings =
    backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);

  const completedOrders = (orders ?? []).filter(
    (o) => o.status === OrderStatus.completed,
  );

  const getListing = (listingId: string) =>
    listings.find((l) => l.id === listingId);

  const handleDownload = async (listingId: string) => {
    setDownloadingId(listingId);
    try {
      const url = await getDownloadUrl.mutateAsync(listingId);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error(
          "Download URL not available. The file may not be uploaded yet.",
        );
      }
    } catch {
      toast.error("Failed to get download link");
    } finally {
      setDownloadingId(null);
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
          <Download className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground">
            Downloads
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          All your purchased files ready to download
        </p>
      </motion.div>

      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : completedOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="p-4 rounded-full bg-muted/40 border border-border/40">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground">
            No downloads yet
          </p>
          <p className="text-sm text-muted-foreground font-body text-center max-w-xs">
            Complete a purchase to see your downloads here
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {completedOrders.map((order, i) => {
            const listing = getListing(order.listingId);
            const isDownloading = downloadingId === order.listingId;

            // Image source
            const imgSrc = (
              listing as unknown as { previewImageKey?: string }
            )?.previewImageKey?.startsWith("/")
              ? (listing as unknown as { previewImageKey?: string })
                  .previewImageKey
              : null;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card/50 hover:border-primary/25 transition-colors"
              >
                {/* Thumbnail */}
                <div className="shrink-0 h-14 w-14 rounded-lg overflow-hidden bg-muted">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={listing?.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <FileDown className="h-5 w-5 text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground truncate">
                    {listing?.title ?? order.listingId}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-body">
                      {new Date(
                        Number(order.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs font-display font-bold text-primary">
                      ${(Number(order.amount) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Download */}
                <Button
                  size="sm"
                  onClick={() => handleDownload(order.listingId)}
                  disabled={isDownloading}
                  className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-display font-semibold shrink-0"
                  variant="outline"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
