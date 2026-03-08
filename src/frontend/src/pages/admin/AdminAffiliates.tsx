import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  DollarSign,
  Link2,
  MousePointerClick,
  Pencil,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function formatEarnings(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommission, setEditCommission] = useState<string>("");

  useEffect(() => {
    const all = loadAffiliates();
    setAffiliates(Object.values(all).sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const refresh = () => {
    const all = loadAffiliates();
    setAffiliates(Object.values(all).sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleToggleActive = (affiliate: AffiliateLink) => {
    const all = loadAffiliates();
    all[affiliate.id] = {
      ...affiliate,
      isActive: !affiliate.isActive,
      updatedAt: Date.now(),
    };
    saveAffiliates(all);
    refresh();
    toast.success(
      affiliate.isActive
        ? `Affiliate ${affiliate.code} deactivated`
        : `Affiliate ${affiliate.code} reactivated`,
    );
  };

  const startEditCommission = (affiliate: AffiliateLink) => {
    setEditingId(affiliate.id);
    setEditCommission(String(affiliate.commissionPercent));
  };

  const saveCommission = (affiliate: AffiliateLink) => {
    const val = Number.parseInt(editCommission, 10);
    if (Number.isNaN(val) || val < 1 || val > 100) {
      toast.error("Commission must be between 1 and 100");
      return;
    }
    const all = loadAffiliates();
    all[affiliate.id] = {
      ...affiliate,
      commissionPercent: val,
      updatedAt: Date.now(),
    };
    saveAffiliates(all);
    setEditingId(null);
    refresh();
    toast.success(`Commission updated to ${val}%`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCommission("");
  };

  // Summary stats
  const totalAffiliates = affiliates.length;
  const totalConversions = affiliates.reduce(
    (s, a) => s + a.conversionCount,
    0,
  );
  const totalEarnings = affiliates.reduce(
    (s, a) => s + a.totalEarningsCents,
    0,
  );
  const totalClicks = affiliates.reduce((s, a) => s + a.clickCount, 0);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="p-2 rounded-lg"
            style={{
              background: "oklch(0.78 0.19 65 / 0.1)",
              border: "1px solid oklch(0.78 0.19 65 / 0.2)",
            }}
          >
            <Link2
              className="h-4 w-4"
              style={{ color: "oklch(0.78 0.19 65)" }}
            />
          </div>
          <div>
            <h1
              className="text-xl font-display font-black"
              style={{ color: "oklch(0.9 0.01 50)" }}
            >
              Affiliate Management
            </h1>
            <p
              className="text-xs font-body"
              style={{ color: "oklch(0.5 0.015 50)" }}
            >
              Manage affiliate links, commission rates, and track performance
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Total Affiliates",
            value: totalAffiliates.toString(),
            color: "oklch(0.78 0.19 65)",
          },
          {
            icon: MousePointerClick,
            label: "Total Clicks",
            value: totalClicks.toLocaleString(),
            color: "oklch(0.65 0.15 200)",
          },
          {
            icon: ShoppingCart,
            label: "Total Conversions",
            value: totalConversions.toLocaleString(),
            color: "oklch(0.72 0.17 160)",
          },
          {
            icon: DollarSign,
            label: "Earnings Paid",
            value: formatEarnings(totalEarnings),
            color: "oklch(0.82 0.18 75)",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-xl border"
            style={{
              background: "oklch(0.14 0.008 50 / 0.8)",
              borderColor: "oklch(0.22 0.015 50)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
              <p
                className="text-xs font-body"
                style={{ color: "oklch(0.55 0.02 50)" }}
              >
                {kpi.label}
              </p>
            </div>
            <p
              className="text-2xl font-display font-black"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <Separator style={{ background: "oklch(0.22 0.015 50)" }} />

      {/* Table */}
      {affiliates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
          data-ocid="admin.affiliates.empty_state"
        >
          <div
            className="p-5 rounded-2xl"
            style={{
              background: "oklch(0.78 0.19 65 / 0.08)",
              border: "1px solid oklch(0.78 0.19 65 / 0.15)",
            }}
          >
            <Link2
              className="h-8 w-8"
              style={{ color: "oklch(0.78 0.19 65 / 0.5)" }}
            />
          </div>
          <div className="text-center">
            <p
              className="font-display font-bold text-base"
              style={{ color: "oklch(0.75 0.02 50)" }}
            >
              No affiliates yet
            </p>
            <p
              className="text-sm font-body mt-1"
              style={{ color: "oklch(0.45 0.015 50)" }}
            >
              Users who generate affiliate links will appear here
            </p>
          </div>
        </motion.div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "oklch(0.22 0.015 50)" }}
        >
          <Table data-ocid="admin.affiliates.table">
            <TableHeader>
              <TableRow style={{ borderColor: "oklch(0.22 0.015 50)" }}>
                {[
                  "User ID",
                  "Code",
                  "Clicks",
                  "Conversions",
                  "Earnings",
                  "Commission %",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-display font-bold uppercase tracking-wider"
                    style={{ color: "oklch(0.45 0.015 50)" }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((affiliate, idx) => {
                const rowNum = idx + 1;
                const isEditing = editingId === affiliate.id;

                return (
                  <TableRow
                    key={affiliate.id}
                    data-ocid={`admin.affiliates.row.${rowNum}`}
                    className="transition-colors"
                    style={{ borderColor: "oklch(0.18 0.01 50)" }}
                  >
                    {/* User ID */}
                    <TableCell>
                      <code
                        className="text-xs font-mono px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.18 0.01 50)",
                          color: "oklch(0.65 0.02 50)",
                        }}
                        title={affiliate.userId}
                      >
                        {truncateId(affiliate.userId)}
                      </code>
                    </TableCell>

                    {/* Code */}
                    <TableCell>
                      <code
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.78 0.19 65 / 0.1)",
                          color: "oklch(0.78 0.19 65)",
                        }}
                      >
                        {affiliate.code}
                      </code>
                    </TableCell>

                    {/* Clicks */}
                    <TableCell>
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: "oklch(0.65 0.15 200)" }}
                      >
                        {affiliate.clickCount.toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Conversions */}
                    <TableCell>
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: "oklch(0.72 0.17 160)" }}
                      >
                        {affiliate.conversionCount.toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Earnings */}
                    <TableCell>
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: "oklch(0.82 0.18 75)" }}
                      >
                        {formatEarnings(affiliate.totalEarningsCents)}
                      </span>
                    </TableCell>

                    {/* Commission % — inline editable */}
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={editCommission}
                            onChange={(e) => setEditCommission(e.target.value)}
                            data-ocid={`admin.affiliates.commission.input.${rowNum}`}
                            className="w-16 h-7 text-xs text-center font-mono px-2"
                            style={{
                              background: "oklch(0.18 0.01 50)",
                              borderColor: "oklch(0.78 0.19 65 / 0.4)",
                              color: "oklch(0.9 0.01 50)",
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveCommission(affiliate);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveCommission(affiliate)}
                            className="p-1 rounded-md transition-colors"
                            style={{ color: "oklch(0.72 0.17 160)" }}
                            aria-label="Save commission"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="p-1 rounded-md transition-colors"
                            style={{ color: "oklch(0.6 0.22 25)" }}
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditCommission(affiliate)}
                          className="group flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all text-xs font-display font-bold"
                          style={{
                            background: "oklch(0.82 0.18 75 / 0.08)",
                            color: "oklch(0.82 0.18 75)",
                            border: "1px solid oklch(0.82 0.18 75 / 0.15)",
                          }}
                          title="Click to edit commission rate"
                          aria-label={`Edit commission rate, currently ${affiliate.commissionPercent}%`}
                        >
                          {affiliate.commissionPercent}%
                          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        className="text-xs font-display font-semibold border"
                        style={
                          affiliate.isActive
                            ? {
                                background: "oklch(0.72 0.17 160 / 0.1)",
                                color: "oklch(0.72 0.17 160)",
                                borderColor: "oklch(0.72 0.17 160 / 0.25)",
                              }
                            : {
                                background: "oklch(0.6 0.22 25 / 0.1)",
                                color: "oklch(0.6 0.22 25)",
                                borderColor: "oklch(0.6 0.22 25 / 0.25)",
                              }
                        }
                      >
                        {affiliate.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Toggle action */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={affiliate.isActive}
                          onCheckedChange={() => handleToggleActive(affiliate)}
                          data-ocid={`admin.affiliates.deactivate.toggle.${rowNum}`}
                          aria-label={
                            affiliate.isActive
                              ? `Deactivate ${affiliate.code}`
                              : `Activate ${affiliate.code}`
                          }
                        />
                        <span
                          className="text-xs font-body"
                          style={{ color: "oklch(0.45 0.015 50)" }}
                        >
                          {affiliate.isActive ? "On" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary footer row */}
          <div
            className="px-4 py-3 flex items-center gap-6 border-t text-xs font-display font-semibold"
            style={{
              background: "oklch(0.12 0.007 50)",
              borderColor: "oklch(0.22 0.015 50)",
              color: "oklch(0.55 0.02 50)",
            }}
          >
            <span>
              Total:{" "}
              <span style={{ color: "oklch(0.9 0.01 50)" }}>
                {totalAffiliates} affiliates
              </span>
            </span>
            <span>
              Conversions:{" "}
              <span style={{ color: "oklch(0.72 0.17 160)" }}>
                {totalConversions}
              </span>
            </span>
            <span>
              Earnings:{" "}
              <span style={{ color: "oklch(0.82 0.18 75)" }}>
                {formatEarnings(totalEarnings)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Sample data note */}
      <div
        className="text-xs font-body px-4 py-3 rounded-xl border"
        style={{
          background: "oklch(0.78 0.19 65 / 0.04)",
          borderColor: "oklch(0.78 0.19 65 / 0.1)",
          color: "oklch(0.5 0.015 50)",
        }}
      >
        <span
          style={{ color: "oklch(0.78 0.19 65)" }}
          className="font-semibold"
        >
          Note:
        </span>{" "}
        Affiliate data is stored locally in this browser. In production, this
        would sync with the backend for cross-device access.
      </div>

      {/* Reload button for dev convenience */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={refresh}
          className="text-xs font-body"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          Refresh data
        </Button>
      </div>
    </div>
  );
}
