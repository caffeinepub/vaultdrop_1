import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { Listing } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import { useGetAnalytics, useGetListings } from "../../hooks/useQueries";

function formatRevenue(cents: bigint): string {
  const val = Number(cents) / 100;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val.toFixed(2)}`;
}

function formatRevenueNum(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: string;
  deltaUp?: boolean;
  delay?: number;
}

function KPICard({
  label,
  value,
  icon: Icon,
  delta,
  deltaUp = true,
  delay = 0,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-xl p-5"
      style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <p
          className="text-[11px] font-display font-semibold uppercase tracking-widest"
          style={{ color: adminMuted }}
        >
          {label}
        </p>
        <div
          className="p-2 rounded-lg"
          style={{
            background: `${adminGold}1a`,
            border: `1px solid ${adminGold}33`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: adminGold }} />
        </div>
      </div>

      <p
        className="text-3xl font-display font-black leading-none mb-2"
        style={{ color: adminGold }}
      >
        {value}
      </p>

      {delta && (
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-display font-bold"
            style={
              deltaUp
                ? {
                    color: "oklch(0.72 0.17 160)",
                    background: "oklch(0.72 0.17 160 / 0.1)",
                  }
                : {
                    color: "oklch(0.6 0.22 25)",
                    background: "oklch(0.6 0.22 25 / 0.1)",
                  }
            }
          >
            {deltaUp ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {delta}
          </span>
          <span className="text-[10px] font-body" style={{ color: adminMuted }}>
            vs last month
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useGetAnalytics();
  const { data: backendListings } = useGetListings();

  const listings =
    backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);

  const getListingTitle = (id: string) =>
    listings.find((l) => l.id === id)?.title ?? id;

  // Deterministic monthly revenue data — no random()
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  const sampleRevenue = [3200, 4100, 5600, 4800, 7200, 9100];
  const maxRevenue = Math.max(...sampleRevenue);
  const totalSampleRevenue = sampleRevenue.reduce((a, b) => a + b, 0);

  // Deterministic top listing revenues (seeded by price)
  const topListingRevenues = SAMPLE_LISTINGS.slice(0, 5).map((l, i) => {
    const multipliers = [18, 14, 11, 9, 7];
    return Number(l.price) * multipliers[i];
  });

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
          <BarChart3 className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Analytics
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          Platform performance overview
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              label="Total Revenue"
              value={analytics ? formatRevenue(analytics.totalRevenue) : "$0"}
              icon={DollarSign}
              delta="+18%"
              deltaUp
              delay={0}
            />
            <KPICard
              label="Monthly Revenue"
              value={analytics ? formatRevenue(analytics.monthlyRevenue) : "$0"}
              icon={TrendingUp}
              delta="+26%"
              deltaUp
              delay={0.05}
            />
            <KPICard
              label="Total Orders"
              value={analytics ? analytics.totalOrders.toString() : "0"}
              icon={ShoppingBag}
              delta="+9%"
              deltaUp
              delay={0.1}
            />
            <KPICard
              label="Active Subscribers"
              value={analytics ? analytics.activeSubscribers.toString() : "0"}
              icon={Star}
              delta="+4%"
              deltaUp
              delay={0.15}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="rounded-xl p-6"
              style={{
                background: adminCard,
                border: `1px solid ${adminBorder}`,
              }}
            >
              {/* Chart header with total */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp
                      className="h-4 w-4"
                      style={{ color: adminGold }}
                    />
                    <p
                      className="font-display font-bold text-sm"
                      style={{ color: adminFg }}
                    >
                      Monthly Revenue Trend
                    </p>
                  </div>
                  <p
                    className="text-xs font-body"
                    style={{ color: adminMuted }}
                  >
                    Last 6 months
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-display font-black"
                    style={{ color: adminGold }}
                  >
                    {formatRevenueNum(totalSampleRevenue)}
                  </p>
                  <p
                    className="text-[10px] font-body uppercase tracking-wider"
                    style={{ color: adminMuted }}
                  >
                    Total Period
                  </p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-2.5 h-44 mt-2">
                {months.map((month, i) => {
                  const height = (sampleRevenue[i] / maxRevenue) * 100;
                  const isLast = i === months.length - 1;
                  return (
                    <div
                      key={month}
                      className="flex-1 flex flex-col items-center gap-1.5 group/bar"
                    >
                      {/* Value label */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="text-[9px] font-display font-bold"
                        style={{ color: isLast ? adminGold : adminMuted }}
                      >
                        {formatRevenueNum(sampleRevenue[i])}
                      </motion.p>

                      {/* Bar */}
                      <div
                        className="w-full flex-1 flex items-end rounded-t overflow-hidden"
                        style={{ minHeight: "8px" }}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{
                            delay: 0.3 + i * 0.06,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="w-full rounded-t-sm"
                          style={{
                            background: isLast ? adminGold : `${adminGold}40`,
                            boxShadow: isLast
                              ? `0 -4px 12px ${adminGold}40`
                              : "none",
                          }}
                        />
                      </div>

                      {/* Month label */}
                      <span
                        className="text-[10px] font-display font-semibold"
                        style={{
                          color: isLast ? adminGold : adminMuted,
                        }}
                      >
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Top listings */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="rounded-xl p-6"
              style={{
                background: adminCard,
                border: `1px solid ${adminBorder}`,
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-4 w-4" style={{ color: adminGold }} />
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: adminFg }}
                >
                  Top Listings
                </p>
              </div>

              {analytics && analytics.topListings.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topListings
                    .slice(0, 5)
                    .map(([listingId, revenue], i) => {
                      const maxRev = Math.max(
                        ...analytics.topListings
                          .slice(0, 5)
                          .map(([, r]) => Number(r)),
                      );
                      const pct = (Number(revenue) / maxRev) * 100;
                      return (
                        <div
                          key={String(listingId)}
                          className="flex items-center gap-3 group/row"
                        >
                          <span
                            className="w-5 shrink-0 text-xs font-display font-black"
                            style={{ color: adminMuted }}
                          >
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-body truncate mb-1"
                              style={{ color: adminFg }}
                            >
                              {getListingTitle(String(listingId))}
                            </p>
                            {/* Mini bar */}
                            <div
                              className="h-1 rounded-full overflow-hidden"
                              style={{ background: `${adminGold}18` }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  delay: 0.4 + i * 0.06,
                                  duration: 0.5,
                                  ease: "easeOut",
                                }}
                                className="h-full rounded-full"
                                style={{ background: adminGold }}
                              />
                            </div>
                          </div>
                          <span
                            className="text-sm font-display font-bold shrink-0"
                            style={{ color: adminGold }}
                          >
                            {formatRevenue(revenue)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-2">
                  {SAMPLE_LISTINGS.slice(0, 5).map((listing, i) => {
                    const maxRev = Math.max(...topListingRevenues);
                    const pct = (topListingRevenues[i] / maxRev) * 100;
                    return (
                      <div key={listing.id} className="flex items-center gap-3">
                        <span
                          className="w-5 shrink-0 text-xs font-display font-black"
                          style={{ color: adminMuted }}
                        >
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-body truncate mb-1"
                            style={{ color: adminFg }}
                          >
                            {listing.title}
                          </p>
                          {/* Mini bar */}
                          <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{ background: `${adminGold}18` }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                delay: 0.4 + i * 0.06,
                                duration: 0.5,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{ background: adminGold }}
                            />
                          </div>
                        </div>
                        <span
                          className="text-sm font-display font-bold shrink-0"
                          style={{ color: adminGold }}
                        >
                          {formatRevenueNum(topListingRevenues[i] / 100)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
