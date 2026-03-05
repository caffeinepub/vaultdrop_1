import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Inbox, Loader2, Plus, Tag, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { DiscountCode } from "../../backend";
import {
  useCreateDiscountCode,
  useDeactivateDiscountCode,
  useGetDiscountCodes,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";
const adminBg = "oklch(0.12 0.007 50)";

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCodeStatus(code: DiscountCode): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  const now = BigInt(Date.now()) * 1_000_000n;
  if (!code.isActive) {
    return {
      label: "Inactive",
      bg: "oklch(0.6 0.22 25 / 0.15)",
      text: "oklch(0.6 0.22 25)",
      border: "oklch(0.6 0.22 25 / 0.3)",
    };
  }
  if (code.expiresAt !== undefined && BigInt(code.expiresAt) < now) {
    return {
      label: "Expired",
      bg: "oklch(0.55 0 0 / 0.15)",
      text: "oklch(0.65 0 0)",
      border: "oklch(0.55 0 0 / 0.3)",
    };
  }
  return {
    label: "Active",
    bg: "oklch(0.72 0.17 160 / 0.15)",
    text: "oklch(0.72 0.17 160)",
    border: "oklch(0.72 0.17 160 / 0.3)",
  };
}

export default function AdminDiscountCodes() {
  const { data: codes, isLoading } = useGetDiscountCodes();
  const createCode = useCreateDiscountCode();
  const deactivate = useDeactivateDiscountCode();

  const [showForm, setShowForm] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [percentInput, setPercentInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const resetForm = () => {
    setCodeInput("");
    setPercentInput("");
    setExpiryInput("");
    setLimitInput("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = codeInput.trim().toUpperCase();
    const percent = Number.parseInt(percentInput, 10);

    if (!code) {
      toast.error("Code is required");
      return;
    }
    if (Number.isNaN(percent) || percent < 1 || percent > 100) {
      toast.error("Discount percent must be between 1 and 100");
      return;
    }

    const expiresAt = expiryInput.trim()
      ? BigInt(new Date(expiryInput).getTime()) * 1_000_000n
      : null;

    const usageLimit =
      limitInput.trim() && Number.parseInt(limitInput, 10) > 0
        ? BigInt(Number.parseInt(limitInput, 10))
        : null;

    try {
      await createCode.mutateAsync({
        code,
        discountPercent: BigInt(percent),
        expiresAt,
        usageLimit,
      });
      toast.success(`Discount code "${code}" created`);
      resetForm();
    } catch {
      toast.error("Failed to create discount code");
    }
  };

  const handleDeactivate = async (codeId: string, codeName: string) => {
    setDeactivatingId(codeId);
    try {
      await deactivate.mutateAsync(codeId);
      toast.success(`Code "${codeName}" deactivated`);
    } catch {
      toast.error("Failed to deactivate code");
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Tag className="h-5 w-5" style={{ color: adminGold }} />
            <h1
              className="text-2xl font-display font-black"
              style={{ color: adminFg }}
            >
              Discount Codes
            </h1>
          </div>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            Create and manage percentage-off discount codes
          </p>
        </div>

        <button
          type="button"
          data-ocid="discount_codes.create_button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-bold transition-all"
          style={{
            background: showForm ? `${adminGold}1a` : adminGold,
            color: showForm ? adminGold : "oklch(0.1 0.01 65)",
            border: showForm ? `1px solid ${adminGold}4d` : "none",
          }}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Create Code"}
        </button>
      </motion.div>

      {/* Create form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="rounded-xl p-6 mb-6 grid grid-cols-2 gap-5"
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <h2
            className="font-display font-bold text-sm col-span-2"
            style={{ color: adminFg }}
          >
            New Discount Code
          </h2>

          {/* Code */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dc-code"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Code <span style={{ color: "oklch(0.6 0.22 25)" }}>*</span>
            </Label>
            <Input
              id="dc-code"
              data-ocid="discount_codes.code_input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
              style={{
                background: adminBg,
                borderColor: adminBorder,
                color: adminFg,
              }}
              className="font-mono uppercase tracking-widest"
            />
          </div>

          {/* Percent */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dc-percent"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Discount % <span style={{ color: "oklch(0.6 0.22 25)" }}>*</span>
            </Label>
            <Input
              id="dc-percent"
              type="number"
              data-ocid="discount_codes.percent_input"
              value={percentInput}
              onChange={(e) => setPercentInput(e.target.value)}
              placeholder="20"
              min={1}
              max={100}
              required
              style={{
                background: adminBg,
                borderColor: adminBorder,
                color: adminFg,
              }}
            />
          </div>

          {/* Expiry */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dc-expiry"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Expiry Date{" "}
              <span className="font-normal" style={{ color: adminMuted }}>
                (optional)
              </span>
            </Label>
            <Input
              id="dc-expiry"
              type="date"
              data-ocid="discount_codes.expiry_input"
              value={expiryInput}
              onChange={(e) => setExpiryInput(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{
                background: adminBg,
                borderColor: adminBorder,
                color: adminFg,
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Usage limit */}
          <div className="space-y-1.5">
            <Label
              htmlFor="dc-limit"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Usage Limit{" "}
              <span className="font-normal" style={{ color: adminMuted }}>
                (optional, blank = unlimited)
              </span>
            </Label>
            <Input
              id="dc-limit"
              type="number"
              data-ocid="discount_codes.limit_input"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="100"
              min={1}
              style={{
                background: adminBg,
                borderColor: adminBorder,
                color: adminFg,
              }}
            />
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex gap-3 pt-1">
            <Button
              type="submit"
              data-ocid="discount_codes.submit_button"
              disabled={createCode.isPending}
              className="font-display font-bold"
              style={{ background: adminGold, color: "oklch(0.1 0.01 65)" }}
            >
              {createCode.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Code
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm font-display font-semibold transition-opacity hover:opacity-70"
              style={{ color: adminMuted }}
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !codes || codes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 gap-4"
          data-ocid="discount_codes.empty_state"
        >
          <Inbox className="h-10 w-10" style={{ color: adminMuted }} />
          <p className="font-display font-semibold" style={{ color: adminFg }}>
            No discount codes yet
          </p>
          <p className="text-sm font-body" style={{ color: adminMuted }}>
            Create your first code to offer discounts to customers
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${adminBorder}` }}
          data-ocid="discount_codes.table"
        >
          {/* Header */}
          <div
            className="grid gap-4 px-5 py-3 text-xs font-display font-semibold uppercase tracking-widest"
            style={{
              background: adminCard,
              color: adminMuted,
              gridTemplateColumns: "1.5fr 80px 140px 120px 100px 100px",
              borderBottom: `1px solid ${adminBorder}`,
            }}
          >
            <span>Code</span>
            <span>Discount</span>
            <span>Expiry</span>
            <span>Usage</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>

          {codes.map((code: DiscountCode, i) => {
            const statusStyle = getCodeStatus(code);
            const usageText = code.usageLimit
              ? `${code.usageCount} / ${code.usageLimit}`
              : `${code.usageCount} / ∞`;
            const isDeactivating = deactivatingId === code.id;

            return (
              <div
                key={code.id}
                data-ocid={`discount_codes.item.${i + 1}`}
                className="grid gap-4 px-5 py-4 items-center"
                style={{
                  gridTemplateColumns: "1.5fr 80px 140px 120px 100px 100px",
                  borderBottom:
                    i < codes.length - 1 ? `1px solid ${adminBorder}` : "none",
                  background:
                    i % 2 === 0 ? "transparent" : "oklch(0.14 0.01 50 / 0.5)",
                }}
              >
                {/* Code */}
                <p
                  className="font-mono text-sm font-bold tracking-wider"
                  style={{ color: adminGold }}
                >
                  {code.code}
                </p>

                {/* Discount */}
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: adminFg }}
                >
                  {Number(code.discountPercent)}%
                </p>

                {/* Expiry */}
                <p className="font-body text-sm" style={{ color: adminMuted }}>
                  {code.expiresAt ? formatDate(code.expiresAt) : "Never"}
                </p>

                {/* Usage */}
                <p className="font-mono text-xs" style={{ color: adminMuted }}>
                  {usageText}
                </p>

                {/* Status */}
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-display font-semibold w-fit"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                >
                  {statusStyle.label}
                </span>

                {/* Action */}
                <div className="flex justify-end">
                  {statusStyle.label === "Active" ? (
                    <button
                      type="button"
                      data-ocid={`discount_codes.deactivate_button.${i + 1}`}
                      onClick={() => handleDeactivate(code.id, code.code)}
                      disabled={isDeactivating}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-display font-semibold transition-opacity hover:opacity-70"
                      style={{
                        color: "oklch(0.6 0.22 25)",
                        background: "oklch(0.6 0.22 25 / 0.12)",
                      }}
                    >
                      {isDeactivating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      Deactivate
                    </button>
                  ) : (
                    <span
                      className="flex items-center gap-1 text-xs font-body"
                      style={{ color: adminMuted }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {statusStyle.label}
                    </span>
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
