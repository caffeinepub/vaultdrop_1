import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from "../../hooks/useQueries";

const adminGold = "oklch(0.78 0.19 65)";
const adminCard = "oklch(0.16 0.012 50)";
const adminBorder = "oklch(0.25 0.015 50)";
const adminMuted = "oklch(0.55 0.02 50)";
const adminFg = "oklch(0.9 0.01 50)";

const DEFAULT_COUNTRIES = ["US", "CA", "GB", "DE", "FR", "AU", "NL", "SE"];

export default function AdminSettings() {
  const { data: isConfigured, isLoading: checkingConfig } =
    useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();

  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [newCountry, setNewCountry] = useState("");

  const handleAddCountry = () => {
    const code = newCountry.trim().toUpperCase();
    if (code.length === 2 && !countries.includes(code)) {
      setCountries((prev) => [...prev, code]);
    }
    setNewCountry("");
  };

  const handleRemoveCountry = (code: string) => {
    setCountries((prev) => prev.filter((c) => c !== code));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) return;

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countries,
      });
      toast.success("Stripe configuration saved successfully");
      setSecretKey("");
    } catch {
      toast.error("Failed to save configuration");
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
          <Settings className="h-5 w-5" style={{ color: adminGold }} />
          <h1
            className="text-2xl font-display font-black"
            style={{ color: adminFg }}
          >
            Settings
          </h1>
        </div>
        <p className="text-sm font-body" style={{ color: adminMuted }}>
          Platform configuration
        </p>
      </motion.div>

      <div className="max-w-xl space-y-6">
        {/* Stripe status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl p-5"
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `${adminGold}1a`,
                  border: `1px solid ${adminGold}33`,
                }}
              >
                <CreditCard className="h-5 w-5" style={{ color: adminGold }} />
              </div>
              <div>
                <p
                  className="font-display font-bold text-sm"
                  style={{ color: adminFg }}
                >
                  Stripe Integration
                </p>
                <p className="text-xs font-body" style={{ color: adminMuted }}>
                  Payment processing configuration
                </p>
              </div>
            </div>
            {checkingConfig ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ color: adminMuted }}
              />
            ) : isConfigured ? (
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="h-4 w-4"
                  style={{ color: "oklch(0.72 0.17 160)" }}
                />
                <span
                  className="text-xs font-display font-semibold"
                  style={{ color: "oklch(0.72 0.17 160)" }}
                >
                  Configured
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <AlertTriangle
                  className="h-4 w-4"
                  style={{ color: "oklch(0.82 0.18 75)" }}
                />
                <span
                  className="text-xs font-display font-semibold"
                  style={{ color: "oklch(0.82 0.18 75)" }}
                >
                  Not configured
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Config form */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-5"
          style={{ background: adminCard, border: `1px solid ${adminBorder}` }}
        >
          <h2
            className="font-display font-bold text-sm"
            style={{ color: adminFg }}
          >
            Configure Stripe
          </h2>

          {/* Secret key */}
          <div className="space-y-1.5">
            <Label
              htmlFor="stripe-key"
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Stripe Secret Key
            </Label>
            <Input
              id="stripe-key"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_… or sk_test_…"
              required
              style={{
                background: "oklch(0.12 0.008 50)",
                borderColor: adminBorder,
                color: adminFg,
              }}
              className="font-mono"
              autoComplete="off"
            />
            <p className="text-xs font-body" style={{ color: adminMuted }}>
              Find this in your Stripe dashboard under Developers → API keys
            </p>
          </div>

          {/* Allowed countries */}
          <div className="space-y-2">
            <Label
              className="font-display text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminMuted }}
            >
              Allowed Countries
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {countries.map((code) => (
                <div
                  key={code}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-display font-semibold"
                  style={{
                    background: `${adminGold}1a`,
                    color: adminGold,
                    border: `1px solid ${adminGold}33`,
                  }}
                >
                  {code}
                  <button
                    type="button"
                    onClick={() => handleRemoveCountry(code)}
                    className="ml-0.5 hover:opacity-60"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
                placeholder="US"
                maxLength={2}
                style={{
                  background: "oklch(0.12 0.008 50)",
                  borderColor: adminBorder,
                  color: adminFg,
                  width: "80px",
                }}
                className="font-mono uppercase text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCountry();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCountry}
                className="px-3 py-1.5 rounded-md text-xs font-display font-semibold transition-opacity hover:opacity-70"
                style={{
                  background: `${adminGold}1a`,
                  color: adminGold,
                  border: `1px solid ${adminGold}33`,
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={setConfig.isPending || !secretKey.trim()}
            className="font-display font-bold w-full"
            style={{ background: adminGold, color: "oklch(0.1 0.01 65)" }}
          >
            {setConfig.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
