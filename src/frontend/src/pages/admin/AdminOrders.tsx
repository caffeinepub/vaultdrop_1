import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Loader2, RotateCcw, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Listing, type Order, OrderStatus } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import {
  useGetAllOrders,
  useGetListings,
  useMarkOrderAsRefunded,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case OrderStatus.completed:
      return {
        bg: "oklch(0.72 0.17 160 / 0.15)",
        text: "oklch(0.72 0.17 160)",
        border: "oklch(0.72 0.17 160 / 0.3)",
        label: "Completed",
      };
    case OrderStatus.pending:
      return {
        bg: "oklch(0.82 0.18 75 / 0.15)",
        text: "oklch(0.82 0.18 75)",
        border: "oklch(0.82 0.18 75 / 0.3)",
        label: "Pending",
      };
    case OrderStatus.refunded:
      return {
        bg: "oklch(0.6 0.22 25 / 0.15)",
        text: "oklch(0.6 0.22 25)",
        border: "oklch(0.6 0.22 25 / 0.3)",
        label: "Refunded",
      };
  }
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useGetAllOrders();
  const { data: backendListings } = useGetListings();
  const markRefunded = useMarkOrderAsRefunded();
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const listings =
    backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);

  const getTitle = (id: string) =>
    listings.find((l) => l.id === id)?.title ?? id;

  const handleRefund = async (orderId: string) => {
    setRefundingId(orderId);
    try {
      await markRefunded.mutateAsync(orderId);
      toast.success("Order marked as refunded");
    } catch {
      toast.error("Failed to refund order");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Orders
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          All platform orders
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Inbox className="h-10 w-10" style={{ color: adminMuted }} />
          <p className="font-display font-semibold" style={{ color: adminFg }}>
            No orders yet
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${adminBorder}` }}
        >
          {/* Header */}
          <div
            className="grid gap-4 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
            style={{
              background: adminCard,
              color: adminMuted,
              gridTemplateColumns: "1fr 160px 100px 100px 80px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Product</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          {orders.map((order: Order, i) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <div
                key={order.id}
                className="grid gap-4 px-5 py-4 items-center"
                style={{
                  gridTemplateColumns: "1fr 160px 100px 100px 80px",
                  borderBottom:
                    i < orders.length - 1 ? `1px solid ${adminBorder}` : "none",
                  background:
                    i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
                }}
              >
                <p
                  className="font-body text-sm truncate"
                  style={{ color: adminFg }}
                >
                  {getTitle(order.listingId)}
                </p>
                <p
                  className="font-mono text-xs truncate"
                  style={{ color: adminMuted }}
                >
                  {order.userId.slice(0, 20)}…
                </p>
                <p className="font-body text-sm" style={{ color: adminMuted }}>
                  {formatDate(order.createdAt)}
                </p>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: adminGold }}
                >
                  ${(Number(order.amount) / 100).toFixed(2)}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-display font-semibold"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                  {order.status === OrderStatus.completed && (
                    <button
                      type="button"
                      onClick={() => handleRefund(order.id)}
                      disabled={refundingId === order.id}
                      title="Refund"
                      className="p-1 rounded transition-opacity hover:opacity-70"
                      style={{ color: "oklch(0.6 0.22 25)" }}
                    >
                      {refundingId === order.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
