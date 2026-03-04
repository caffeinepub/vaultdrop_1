import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldOff } from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "../hooks/useQueries";
import ProfileSetupModal from "./ProfileSetupModal";

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

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

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isInitializing && !isAuthenticated && requireAuth) {
      navigate({ to: "/" });
    }
  }, [isInitializing, isAuthenticated, requireAuth, navigate]);

  // Redirect non-admins from admin routes
  useEffect(() => {
    if (requireAdmin && isAuthenticated && !adminLoading && isAdmin === false) {
      navigate({ to: "/dashboard" });
    }
  }, [requireAdmin, isAuthenticated, adminLoading, isAdmin, navigate]);

  // Loading states
  if (isInitializing || (requireAuth && !isAuthenticated)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-body">Loading…</p>
        </div>
      </div>
    );
  }

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
