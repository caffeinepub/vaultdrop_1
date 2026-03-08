import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  FileDown,
  Inbox,
  Key,
  Loader2,
} from "lucide-react";
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

// ─── License Key Utilities ────────────────────────────────────────────────────

function generateDisplayLicenseKey(orderId: string): string {
  const hash = orderId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const segments: string[] = [];
  let seed = hash;
  for (let i = 0; i < 4; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    segments.push(
      Math.abs(seed).toString(16).toUpperCase().padStart(6, "0").slice(0, 6),
    );
  }
  return segments.join("-");
}

export default function DashboardDownloads() {
  const { data: orders, isLoading: ordersLoading } = useGetUserOrders();
  const { data: backendListings } = useGetListings();
  const getDownloadUrl = useGetDownloadFileUrl();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopyKey = async (orderId: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(orderId);
      toast.success("License key copied!");
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch {
      toast.error("Failed to copy license key");
    }
  };

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
          <Link to="/listings">
            <Button
              variant="outline"
              data-ocid="downloads.browse.button"
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
          className="space-y-3"
        >
          {completedOrders.map((order, i) => {
            const listing = getListing(order.listingId);
            const isDownloading = downloadingId === order.listingId;
            const licenseKey = generateDisplayLicenseKey(order.id);
            const isCopied = copiedKeyId === order.id;

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
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/60 bg-card/50 hover:border-primary/25 transition-colors"
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

                  {/* License Key */}
                  <div className="flex items-center gap-2 mt-2">
                    <Key className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                    <Badge
                      variant="outline"
                      data-ocid={`downloads.license_key.${i + 1}`}
                      className="font-mono text-xs px-2 py-0.5 border-border/50 text-muted-foreground bg-muted/30 tracking-widest select-all cursor-text"
                    >
                      {licenseKey}
                    </Badge>
                    <button
                      type="button"
                      aria-label="Copy license key"
                      data-ocid={`downloads.copy_key_button.${i + 1}`}
                      onClick={() => void handleCopyKey(order.id, licenseKey)}
                      className="flex items-center justify-center h-5 w-5 rounded border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/35 text-muted-foreground hover:text-primary transition-all duration-150"
                    >
                      {isCopied ? (
                        <Check className="h-2.5 w-2.5 text-primary" />
                      ) : (
                        <Copy className="h-2.5 w-2.5" />
                      )}
                    </button>
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
