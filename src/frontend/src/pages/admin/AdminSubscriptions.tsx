import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Loader2, Star } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { type Subscription, SubscriptionStatus } from "../../backend";
import {
  useGetAllSubscriptions,
  useUpdateSubscriptionStatus,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

function getStatusStyle(status: SubscriptionStatus) {
  switch (status) {
    case SubscriptionStatus.active:
      return {
        bg: "oklch(0.72 0.17 160 / 0.15)",
        text: "oklch(0.72 0.17 160)",
        border: "oklch(0.72 0.17 160 / 0.3)",
        label: "Active",
      };
    case SubscriptionStatus.cancelled:
      return {
        bg: "oklch(0.6 0.22 25 / 0.15)",
        text: "oklch(0.6 0.22 25)",
        border: "oklch(0.6 0.22 25 / 0.3)",
        label: "Cancelled",
      };
    case SubscriptionStatus.expired:
      return {
        bg: "oklch(0.55 0 0 / 0.15)",
        text: "oklch(0.65 0 0)",
        border: "oklch(0.55 0 0 / 0.3)",
        label: "Expired",
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

export default function AdminSubscriptions() {
  const { data: subscriptions, isLoading } = useGetAllSubscriptions();
  const updateStatus = useUpdateSubscriptionStatus();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleCancelSub = async (subId: string) => {
    setActionId(subId);
    try {
      await updateStatus.mutateAsync({
        subscriptionId: subId,
        status: SubscriptionStatus.cancelled,
      });
      toast.success("Subscription cancelled");
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setActionId(null);
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
          <Star className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Subscriptions
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          All active and past subscriptions
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !subscriptions || subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Inbox className="h-10 w-10" style={{ color: adminMuted }} />
          <p className="font-display font-semibold" style={{ color: adminFg }}>
            No subscriptions yet
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
              gridTemplateColumns: "1fr 150px 140px 90px 80px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Subscriber ID</span>
            <span>Stripe Sub ID</span>
            <span>Renews</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          {subscriptions.map((sub: Subscription, i) => {
            const s = getStatusStyle(sub.status);
            const isProcessing = actionId === sub.id;

            return (
              <div
                key={sub.id}
                className="grid gap-4 px-5 py-4 items-center"
                style={{
                  gridTemplateColumns: "1fr 150px 140px 90px 80px",
                  borderBottom:
                    i < subscriptions.length - 1
                      ? `1px solid ${adminBorder}`
                      : "none",
                  background:
                    i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
                }}
              >
                <p
                  className="font-mono text-xs truncate"
                  style={{ color: adminFg }}
                >
                  {sub.userId.slice(0, 24)}…
                </p>
                <p
                  className="font-mono text-xs truncate"
                  style={{ color: adminMuted }}
                >
                  {sub.stripeSubscriptionId.slice(0, 20)}…
                </p>
                <p className="font-body text-sm" style={{ color: adminMuted }}>
                  {formatDate(sub.currentPeriodEnd)}
                </p>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-display font-semibold w-fit"
                  style={{
                    background: s.bg,
                    color: s.text,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  {s.label}
                </span>
                <div className="flex justify-end">
                  {sub.status === SubscriptionStatus.active && (
                    <button
                      type="button"
                      onClick={() => handleCancelSub(sub.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-semibold transition-opacity hover:opacity-70"
                      style={{
                        color: "oklch(0.6 0.22 25)",
                        background: "oklch(0.6 0.22 25 / 0.12)",
                      }}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Cancel"
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
