import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Key, Loader2, Lock, Shield, Vault } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const trustBadges = [
  {
    icon: Shield,
    label: "No passwords stored",
  },
  {
    icon: Key,
    label: "Cryptographic identity",
  },
  {
    icon: Lock,
    label: "Powered by Internet Computer",
  },
];

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Redirect already-authenticated users immediately
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate({ to: "/admin/analytics" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // Redirect on successful login
  useEffect(() => {
    if (loginStatus === "success") {
      navigate({ to: "/admin/analytics" });
    }
  }, [loginStatus, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch {
      // login() handles errors internally
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background atmosphere — admin amber tone */}
      <div className="absolute inset-0 gradient-admin-hero" />
      <div
        className="absolute inset-0 dot-grid opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.78 0.19 65 / 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "oklch(0.78 0.19 65 / 0.06)" }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Back link */}
      <motion.a
        href="/"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-body"
        data-ocid="admin-signin.link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <title>Back arrow</title>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to home
      </motion.a>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card-admin rounded-2xl p-8 md:p-10 shadow-card-glow">
          {/* Branding — admin amber */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: "backOut" }}
              className="relative"
            >
              <div
                className="p-4 rounded-2xl border"
                style={{
                  background: "oklch(0.78 0.19 65 / 0.1)",
                  borderColor: "oklch(0.78 0.19 65 / 0.25)",
                  boxShadow: "0 0 20px oklch(0.78 0.19 65 / 0.2)",
                }}
              >
                <Vault
                  className="h-8 w-8"
                  style={{ color: "oklch(0.78 0.19 65)" }}
                />
              </div>
              <div
                className="absolute -inset-2 rounded-3xl border pointer-events-none"
                style={{ borderColor: "oklch(0.78 0.19 65 / 0.1)" }}
              />
            </motion.div>

            <div className="text-center">
              <h1 className="text-2xl font-display font-black text-foreground tracking-tight">
                Admin{" "}
                <span
                  className="glow-text-admin"
                  style={{ color: "oklch(0.78 0.19 65)" }}
                >
                  Access
                </span>
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">
                Restricted area. Admin credentials required.
              </p>
            </div>
          </div>

          {/* Warning card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: "oklch(0.78 0.19 65 / 0.06)",
              borderColor: "oklch(0.78 0.19 65 / 0.2)",
            }}
            data-ocid="admin-signin.panel"
          >
            <AlertTriangle
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.78 0.19 65)" }}
            />
            <p
              className="text-xs font-body leading-relaxed"
              style={{ color: "oklch(0.78 0.19 65 / 0.9)" }}
            >
              This area is restricted to authorized administrators only.
              Unauthorized access attempts are logged.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn || isInitializing}
              className="w-full h-12 font-display font-bold text-base"
              style={{
                background: isLoggingIn
                  ? "oklch(0.78 0.19 65 / 0.7)"
                  : "oklch(0.78 0.19 65)",
                color: "oklch(0.1 0.01 65)",
                boxShadow: "0 0 20px oklch(0.78 0.19 65 / 0.3)",
              }}
              data-ocid="admin-signin.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In with Internet Identity
                </>
              )}
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border"
                style={{
                  background: "oklch(0.78 0.19 65 / 0.07)",
                  borderColor: "oklch(0.78 0.19 65 / 0.15)",
                  color: "oklch(0.7 0.01 65)",
                }}
              >
                <badge.icon
                  className="h-3 w-3 shrink-0"
                  style={{ color: "oklch(0.78 0.19 65)" }}
                />
                <span>{badge.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Explainer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="mt-8 pt-6 border-t border-border/30"
          >
            <h2 className="text-xs font-display font-bold text-foreground/70 uppercase tracking-widest mb-2">
              What is Internet Identity?
            </h2>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Internet Identity is a secure, password-free authentication system
              built into the Internet Computer blockchain. It uses cryptographic
              keypairs stored on your device — your identity is provable and
              unforgeable.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
