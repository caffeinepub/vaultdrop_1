import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  MousePointerClick,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../../hooks/useQueries";

// ─── Data model ───────────────────────────────────────────────────────────────

interface AffiliateLink {
  id: string;
  userId: string;
  code: string;
  clickCount: number;
  conversionCount: number;
  totalEarningsCents: number;
  commissionPercent: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "vaultdrop_affiliates";

function loadAffiliates(): Record<string, AffiliateLink> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveAffiliates(data: Record<string, AffiliateLink>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardAffiliate() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const userId = identity?.getPrincipal().toString() ?? "";

  const [affiliateLink, setAffiliateLink] = useState<AffiliateLink | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Load affiliate link on mount
  useEffect(() => {
    if (!userId) return;
    const all = loadAffiliates();
    const found = Object.values(all).find((a) => a.userId === userId);
    if (found) setAffiliateLink(found);
  }, [userId]);

  const referralUrl = affiliateLink
    ? `${window.location.origin}/listings?ref=${affiliateLink.code}`
    : "";

  const handleGenerate = () => {
    if (!userId) {
      toast.error("Please sign in to generate your affiliate link");
      return;
    }
    const code = generateCode();
    const now = Date.now();
    const newLink: AffiliateLink = {
      id: `aff_${now}`,
      userId,
      code,
      clickCount: 0,
      conversionCount: 0,
      totalEarningsCents: 0,
      commissionPercent: 10,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const all = loadAffiliates();
    all[newLink.id] = newLink;
    saveAffiliates(all);
    setAffiliateLink(newLink);
    toast.success("Affiliate link generated! Start sharing to earn.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const formatEarnings = (cents: number): string =>
    `$${(cents / 100).toFixed(2)}`;

  const memberSince = affiliateLink
    ? new Date(affiliateLink.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground tracking-tight">
            Affiliate Program
          </h1>
          {affiliateLink?.isActive && (
            <Badge className="bg-primary/10 text-primary border-primary/20 font-display font-semibold text-xs ml-1">
              Active
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-body">
          {userProfile?.username ? `Welcome, ${userProfile.username}. ` : ""}
          Earn 10% commission on every sale you refer.
        </p>
      </motion.div>

      <Separator className="bg-border/40" />

      {/* ─── No link yet ────────────────────────────────────────── */}
      {!affiliateLink ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/60 p-10 text-center"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 dot-grid opacity-20" />

          <div className="relative z-10">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <Link2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-black text-foreground mb-2">
              Join the Affiliate Program
            </h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto mb-2">
              Generate your unique referral link and start earning{" "}
              <span className="text-primary font-display font-bold">
                10% commission
              </span>{" "}
              on every completed sale you drive.
            </p>
            <p className="text-xs text-muted-foreground/60 font-body mb-8">
              Free to join. No approval required. Instant setup.
            </p>

            {/* Feature list */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
              {[
                { icon: Link2, text: "Unique referral link" },
                { icon: TrendingUp, text: "Real-time click tracking" },
                { icon: DollarSign, text: "10% on every sale" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-background/40"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/15 shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-body text-muted-foreground">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              data-ocid="affiliate.generate.primary_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold h-12 px-8"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Link
            </Button>
          </div>
        </motion.div>
      ) : (
        /* ─── Has link ──────────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Link display card */}
          <div className="p-6 rounded-2xl border border-primary/20 bg-card/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-foreground">
                  Your Referral Link
                </h2>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  Share this link to earn commission on purchases
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display font-bold"
                style={{
                  background: "oklch(0.72 0.17 160 / 0.1)",
                  border: "1px solid oklch(0.72 0.17 160 / 0.2)",
                  color: "oklch(0.72 0.17 160)",
                }}
              >
                <TrendingUp className="h-3 w-3" />
                {affiliateLink.commissionPercent}% Commission
              </div>
            </div>

            {/* URL row */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm font-mono text-muted-foreground truncate border bg-background/40"
                style={{ borderColor: "oklch(0.72 0.17 160 / 0.15)" }}
              >
                {referralUrl}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                data-ocid="affiliate.copy.button"
                className={
                  copied
                    ? "bg-primary/20 text-primary border border-primary/30 font-display font-semibold"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold"
                }
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="border-border/50 font-display font-semibold shrink-0"
              >
                <a href={referralUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>

            {/* Code display */}
            <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <span>Referral code:</span>
              <code
                className="px-2 py-0.5 rounded-md font-mono text-primary"
                style={{ background: "oklch(0.72 0.17 160 / 0.08)" }}
              >
                {affiliateLink.code}
              </code>
              {memberSince && (
                <>
                  <span className="text-border">·</span>
                  <span>Active since {memberSince}</span>
                </>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 gap-4"
            data-ocid="affiliate.stats.panel"
          >
            {[
              {
                icon: MousePointerClick,
                label: "Total Clicks",
                value: affiliateLink.clickCount.toLocaleString(),
                color: "oklch(0.65 0.15 200)",
                bg: "oklch(0.65 0.15 200 / 0.08)",
                border: "oklch(0.65 0.15 200 / 0.15)",
              },
              {
                icon: ShoppingCart,
                label: "Conversions",
                value: affiliateLink.conversionCount.toLocaleString(),
                color: "oklch(0.72 0.17 160)",
                bg: "oklch(0.72 0.17 160 / 0.08)",
                border: "oklch(0.72 0.17 160 / 0.15)",
              },
              {
                icon: DollarSign,
                label: "Total Earned",
                value: formatEarnings(affiliateLink.totalEarningsCents),
                color: "oklch(0.82 0.18 75)",
                bg: "oklch(0.82 0.18 75 / 0.08)",
                border: "oklch(0.82 0.18 75 / 0.15)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-5 rounded-xl border"
                style={{ background: stat.bg, borderColor: stat.border }}
              >
                <div
                  className="p-2 rounded-lg w-fit mb-3"
                  style={{
                    background: stat.bg,
                    border: `1px solid ${stat.border}`,
                  }}
                >
                  <stat.icon
                    className="h-4 w-4"
                    style={{ color: stat.color }}
                  />
                </div>
                <p
                  className="text-2xl font-display font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Info note */}
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm font-body border"
            style={{
              background: "oklch(0.82 0.18 75 / 0.05)",
              borderColor: "oklch(0.82 0.18 75 / 0.15)",
              color: "oklch(0.75 0.08 75)",
            }}
          >
            <TrendingUp
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.82 0.18 75)" }}
            />
            <p>
              <span
                className="font-display font-bold"
                style={{ color: "oklch(0.82 0.18 75)" }}
              >
                Earnings are credited
              </span>{" "}
              when referred users complete purchases through your link.
              Conversions are tracked automatically.
            </p>
          </div>

          {/* Share CTA */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40">
            <div>
              <p className="font-display font-bold text-sm text-foreground">
                Ready to share?
              </p>
              <p className="text-xs text-muted-foreground font-body">
                Post in newsletters, social media, or YouTube descriptions
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleCopy}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold shrink-0"
            >
              Copy Link
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
