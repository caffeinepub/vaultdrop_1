import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Key,
  Loader2,
  Lock,
  Shield,
  ShieldOff,
  Vault,
} from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";
import ProfileSetupModal from "./ProfileSetupModal";

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

// ─── Access Required screen (user) ──────────────────────────────────────────

function UserAccessRequired() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="glass-card rounded-2xl p-8 text-center shadow-card-glow">
          <div className="flex justify-center mb-5">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-glow">
              <Vault className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="text-xl font-display font-black text-foreground mb-1.5">
            Sign In Required
          </h2>
          <p className="text-sm text-muted-foreground font-body leading-relaxed mb-6">
            Sign in to access your dashboard and manage your orders, downloads,
            and subscriptions.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { icon: Shield, label: "No passwords" },
              { icon: Key, label: "Cryptographic" },
              { icon: Lock, label: "ICP-secured" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/15 text-xs font-body text-muted-foreground"
              >
                <b.icon className="h-3 w-3 text-primary shrink-0" />
                {b.label}
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate({ to: "/sign-in" })}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold"
            data-ocid="authgate.primary_button"
          >
            Sign in to your dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Access Required screen (admin) ─────────────────────────────────────────

function AdminAccessRequired() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 gradient-admin-hero" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.78 0.19 65 / 0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "oklch(0.78 0.19 65 / 0.06)" }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="glass-card-admin rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-5">
            <div
              className="p-4 rounded-2xl border"
              style={{
                background: "oklch(0.78 0.19 65 / 0.1)",
                borderColor: "oklch(0.78 0.19 65 / 0.25)",
                boxShadow: "0 0 20px oklch(0.78 0.19 65 / 0.2)",
              }}
            >
              <Shield
                className="h-8 w-8"
                style={{ color: "oklch(0.78 0.19 65)" }}
              />
            </div>
          </div>

          <h2 className="text-xl font-display font-black text-foreground mb-1.5">
            Admin Access Required
          </h2>
          <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
            This area is restricted to authorized administrators only.
          </p>

          <div
            className="flex items-start gap-2.5 p-3 rounded-xl mb-6 text-left border"
            style={{
              background: "oklch(0.78 0.19 65 / 0.06)",
              borderColor: "oklch(0.78 0.19 65 / 0.2)",
            }}
          >
            <AlertTriangle
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.78 0.19 65)" }}
            />
            <p
              className="text-xs font-body leading-relaxed"
              style={{ color: "oklch(0.78 0.19 65 / 0.9)" }}
            >
              Unauthorized access attempts are logged.
            </p>
          </div>

          <Button
            onClick={() => navigate({ to: "/admin/sign-in" })}
            className="w-full h-11 font-display font-bold"
            style={{
              background: "oklch(0.78 0.19 65)",
              color: "oklch(0.1 0.01 65)",
              boxShadow: "0 0 20px oklch(0.78 0.19 65 / 0.3)",
            }}
            data-ocid="authgate.admin.primary_button"
          >
            Sign in as Admin
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── AuthGate ────────────────────────────────────────────────────────────────

export default function AuthGate({
  children,
  requireAuth = false,
  requireAdmin = false,
}: AuthGateProps) {
  const navigate = useNavigate();
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  // Redirect non-admins from admin routes (still redirect when verified non-admin)
  useEffect(() => {
    if (requireAdmin && isAuthenticated && !adminLoading && isAdmin === false) {
      navigate({ to: "/dashboard" });
    }
  }, [requireAdmin, isAuthenticated, adminLoading, isAdmin, navigate]);

  // Global loading — still initializing auth state
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-body">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show inline access-required screen (no redirect)
  if (requireAuth && !isAuthenticated) {
    return requireAdmin ? <AdminAccessRequired /> : <UserAccessRequired />;
  }

  // Admin check loading
  if (requireAdmin && adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Banned user screen
  if (isAuthenticated && profileFetched && userProfile?.isBanned) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm p-8">
          <div className="p-4 rounded-full bg-destructive/10 border border-destructive/30">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Account Suspended
          </h2>
          <p className="text-muted-foreground font-body">
            Your account has been suspended. Please contact support if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  // Profile setup modal for first-time users
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      {!showProfileSetup && children}
    </>
  );
}
