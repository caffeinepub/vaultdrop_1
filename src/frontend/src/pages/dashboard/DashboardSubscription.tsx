import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Loader2,
  Lock,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { SubscriptionStatus } from "../../backend";
import { SUBSCRIPTION_PRICE_CENTS } from "../../data/sampleListings";
import {
  useCreateCheckoutSession,
  useCreateSubscription,
  useGetCallerUserProfile,
  useGetStripeSessionStatus,
  useGetUserSubscriptions,
  useUpdateSubscriptionStatus,
} from "../../hooks/useQueries";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SUBSCRIPTION_PERKS = [
  "Early access to all upcoming listings",
  "New products before public release",
  "Subscriber-only deals and bundles",
  "Priority support",
];

export default function DashboardSubscription() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: subscriptions, isLoading } = useGetUserSubscriptions();
  const createCheckout = useCreateCheckoutSession();
  const getSessionStatus = useGetStripeSessionStatus();
  const createSubscription = useCreateSubscription();
  const updateSubscriptionStatus = useUpdateSubscriptionStatus();
  const processedRef = useRef<string | null>(null);

  const searchParams = useSearch({ strict: false }) as { session_id?: string };
  const sessionId = searchParams.session_id;

  const isSubscribed = userProfile?.role === "subscribed";

  const activeSubscription = subscriptions?.find(
    (s) => s.status === SubscriptionStatus.active,
  );

  // Handle returning Stripe session — using ref to avoid repeated processing
  useEffect(() => {
    if (!sessionId || processedRef.current === sessionId) return;
    processedRef.current = sessionId;

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
          const stripeSubId =
            (response as { subscription?: string })?.subscription ??
            `sub_${Date.now()}`;
          const periodEnd =
            BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 3600) *
            1_000_000_000n;
          await createSubscription.mutateAsync({
            stripeSubscriptionId: stripeSubId,
            currentPeriodEnd: periodEnd,
          });
          toast.success("Subscription activated! You now have early access.");
        } else {
          toast.error("Subscription payment failed.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to activate subscription");
      }
    })();
  }, [sessionId, getSessionStatus, createSubscription]);

  const handleSubscribe = async () => {
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/dashboard/subscription`;

      const session = await createCheckout.mutateAsync({
        items: [
          {
            productName: "VaultDrop Subscription",
            productDescription:
              "Monthly subscription for early access to all upcoming listings",
            priceInCents: SUBSCRIPTION_PRICE_CENTS,
            quantity: 1n,
            currency: "usd",
          },
        ],
        successUrl,
        cancelUrl,
      });

      if (!session?.url) throw new Error("Missing session URL");
      window.location.href = session.url;
    } catch {
      toast.error("Failed to start checkout. Is Stripe configured?");
    }
  };

  const handleCancel = async () => {
    if (!activeSubscription) return;
    try {
      await updateSubscriptionStatus.mutateAsync({
        subscriptionId: activeSubscription.id,
        status: SubscriptionStatus.cancelled,
      });
      toast.success("Subscription cancelled.");
    } catch {
      toast.error("Failed to cancel subscription");
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
          <Star className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground">
            Subscription
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Manage your VaultDrop early access plan
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="max-w-lg space-y-5">
          {/* Status card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border p-6 ${
              isSubscribed
                ? "border-primary/30 bg-primary/5"
                : "border-border/60 bg-card/50"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${isSubscribed ? "bg-primary/15" : "bg-muted/60"}`}
                >
                  {isSubscribed ? (
                    <Star className="h-5 w-5 text-primary fill-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold text-foreground">
                    {isSubscribed ? "VaultDrop Subscriber" : "Free Plan"}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {isSubscribed
                      ? "You have early access to all upcoming drops"
                      : "Upgrade to unlock early access"}
                  </p>
                </div>
              </div>
              {isSubscribed ? (
                <Badge className="bg-primary/15 text-primary border-primary/25 font-display font-semibold shrink-0">
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="font-display font-semibold shrink-0"
                >
                  Free
                </Badge>
              )}
            </div>

            {activeSubscription && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-muted/40">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs font-body text-muted-foreground">
                  Renews on{" "}
                  <span className="text-foreground font-medium">
                    {formatDate(activeSubscription.currentPeriodEnd)}
                  </span>
                </p>
              </div>
            )}
          </motion.div>

          {/* Pricing card */}
          {!isSubscribed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="rounded-2xl border border-primary/25 bg-card/80 p-6"
            >
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-display font-black text-primary">
                  ${(Number(SUBSCRIPTION_PRICE_CENTS) / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground font-body">/month</span>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-5">
                Cancel anytime. No commitment.
              </p>

              <ul className="space-y-2 mb-6">
                {SUBSCRIPTION_PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm font-body text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold"
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Cancel */}
          {isSubscribed && activeSubscription && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-border/40 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-body text-muted-foreground">
                    Canceling will remove your early access at the end of the
                    current billing period.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10 font-display font-semibold"
                onClick={handleCancel}
                disabled={updateSubscriptionStatus.isPending}
              >
                {updateSubscriptionStatus.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Cancel Subscription
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
